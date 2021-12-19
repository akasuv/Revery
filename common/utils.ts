import {
    DonationDetailByGrant,
    GeneralAssetWithTags,
    GitcoinResponse,
    ItemDetails,
    NFT,
    NFTResponse,
    POAP,
    POAPResponse,
} from './types';
import config from './config';
import RSS3, { RSS3DetailPersona } from './rss3';
import { utils as RSS3Utils } from 'rss3';
import { AnyObject } from 'rss3/types/extend';
import { formatter } from './address';
import { FILTER_TAGS } from '../components/filter/FilterTag';

const orderPattern = new RegExp(`^${config.tags.prefix}:order:(-?\\d+)$`, 'i');

type TypesWithTag = RSS3Account | GeneralAssetWithTags;

const getTaggedOrder = (tagged: TypesWithTag): number => {
    if (!tagged.tags) {
        return -1;
    }
    // const orderPattern = /^pass:order:(-?\d+)$/i;
    for (const tag of tagged.tags) {
        if (orderPattern.test(tag)) {
            return parseInt(orderPattern.exec(tag)?.[1] || '-1');
        }
    }
    return -1;
};

function sortByOrderTag<T extends TypesWithTag>(taggeds: T[]): T[] {
    taggeds.sort((a, b) => {
        return getTaggedOrder(a) - getTaggedOrder(b);
    });
    return taggeds;
}

async function initAssets() {
    const pageOwner = RSS3.getPageOwner();

    let assetList = await pageOwner.assets?.auto.getList(pageOwner.address);

    let taggedList = <{ id: string; hide?: boolean; order?: number }[]>[];
    const passTags = (await pageOwner.files.get(pageOwner.address))._pass?.assets;
    taggedList = passTags ? passTags : [];

    const hiddenList = taggedList
        .filter((asset: any) => asset.hasOwnProperty('hide'))
        .map((asset: { id: string }) => asset.id);

    const orderedList = taggedList
        .filter((asset: any) => !asset.hasOwnProperty('hide'))
        .sort((a: any, b: any) => a.order - b.order)
        .map((asset: { id: string }) => asset.id);

    if (hiddenList.length > 0) {
        assetList = assetList?.filter((asset) => hiddenList.indexOf(asset) < 0);
    }
    if (orderedList.length > 0) {
        assetList = assetList?.filter((asset) => orderedList.indexOf(asset) < 0);
    }
    const orderedAssetList = assetList?.concat(orderedList);

    const parsedAssets = orderedAssetList?.map((asset) => RSS3Utils.id.parseAsset(asset));
    const nfts = parsedAssets?.filter((asset) => asset.type.split('.')[1] === 'NFT');
    const donations = parsedAssets?.filter((asset) => asset.type.split('.')[1] === 'Donation');
    const footprints = parsedAssets?.filter((asset) => asset.type.split('.')[1] === 'POAP');

    return {
        nfts: nfts && nfts.length > 0 ? nfts : <AnyObject[]>[],
        donations: donations && donations.length > 0 ? donations : <AnyObject[]>[],
        footprints: footprints && footprints.length > 0 ? footprints : <AnyObject[]>[],
    };
}

async function loadAssets(parsedAssets: AnyObject[]) {
    const pageOwner = RSS3.getPageOwner();

    const assetIDList = parsedAssets.map((asset) =>
        RSS3Utils.id.getAsset(asset.platform, asset.identity, asset.type, asset.uniqueID),
    );
    return assetIDList.length !== 0
        ? (await pageOwner.assets?.getDetails({
              assets: assetIDList,
              full: true,
          })) || []
        : [];
}

async function getAssetsTillSuccess(assetSet: Set<string>, delay: number = 1500, count: number = 5) {
    const pageOwner = RSS3.getPageOwner();
    return new Promise<(NFTResponse | GitcoinResponse | POAPResponse)[]>(async (resolve, reject) => {
        const tryReq = async () => {
            try {
                const details = (await pageOwner.assets?.getDetails({
                    assets: Array.from(assetSet),
                    full: true,
                })) as (NFTResponse | GitcoinResponse | POAPResponse)[];
                if (details) {
                    resolve(details);
                    return true;
                }
            } catch (e) {
                reject(e);
            }
            return false;
        };

        if (!(await tryReq())) {
            let iv = setInterval(async () => {
                count--;
                if (count < 0) {
                    resolve([]);
                    clearInterval(iv);
                } else if (await tryReq()) {
                    clearInterval(iv);
                }
            }, delay);
        }
    });
}

async function initAccounts() {
    const listed: RSS3Account[] = [];
    const unlisted: RSS3Account[] = [];

    const pageOwner = RSS3.getPageOwner();
    const allAccounts = (await pageOwner.profile?.accounts) || [];
    for (const account of allAccounts) {
        if (account.tags?.includes(`${config.tags.prefix}:${config.tags.hiddenTag}`)) {
            unlisted.push(account);
        } else {
            listed.push(account);
        }
    }

    return {
        listed: utils.sortByOrderTag(listed),
        unlisted,
    };
}

function isAsset(field: string | undefined): boolean {
    const condition = ['NFT', 'POAP', 'Gitcoin'];
    return !!(field && condition.find((item) => field.includes(item)));
}

const filterTagSQLMap = new Map([
    [FILTER_TAGS.nft, '%NFT%'],
    [FILTER_TAGS.donation, '%Gitcoin.Donation%'],
    [FILTER_TAGS.footprint, '%POAP%'],
]);

const contentFilterTagSQLList = ['%Twitter%', '%Mirror.XYZ%', '%Misskey%', '%Arweave%'];

async function initContent(timestamp: string = '', following: boolean = false, filters?: { key: any; value: any }[]) {
    const assetSet = new Set<string>();
    const profileSet = new Set<string>();
    const apiUser = await RSS3.getAPIUser();
    const pageOwner = await RSS3.getPageOwner();

    let filteredContent: any = [];
    let items: any = [];

    if (filters && following) {
        filteredContent = await Promise.all(
            filters.map(async (tag) => {
                if (tag.value && tag.key != FILTER_TAGS.content) {
                    return await pageOwner.items?.getListByPersona({
                        persona: pageOwner.address,
                        linkID: 'following',
                        limit: config.splitPageLimits.contents,
                        tsp: timestamp,
                        fieldLike: filterTagSQLMap.get(tag.key),
                    });
                } else if (tag.value && tag.key == FILTER_TAGS.content) {
                    return Promise.all(
                        contentFilterTagSQLList.map(async (tag) => {
                            return await pageOwner.items?.getListByPersona({
                                persona: pageOwner.address,
                                linkID: 'following',
                                limit: config.splitPageLimits.contents,
                                tsp: timestamp,
                                fieldLike: tag,
                            });
                        }),
                    ).then((value) => {
                        let content: any[] = [];
                        return content.concat(...value);
                    });
                }
            }),
        ).then((value) => {
            return value;
        });
        items = []
            .concat(...filteredContent.filter((item: any) => item))
            .sort((a: any, b: any) => new Date(b.date_updated).valueOf() - new Date(a.date_updated).valueOf())
            .slice(0, 35);
    } else if (!following) {
        items =
            (await pageOwner.items?.getListByPersona({
                persona: pageOwner.address,
                limit: config.splitPageLimits.contents,
                tsp: timestamp,
            })) || [];
    }

    const haveMore = items.length === config.splitPageLimits.contents;

    profileSet.add(pageOwner.address);
    items.forEach((item: any) => {
        if ('target' in item) {
            // Is auto item
            if (isAsset(item.target.field)) {
                assetSet.add(item.target.field.substring(7, item.target.field.length));
            }
        }
        profileSet.add(item.id.split('-')[0]);
    });

    const [details, profiles] = await Promise.all([
        assetSet.size !== 0 ? getAssetsTillSuccess(assetSet) : [],
        profileSet.size !== 0
            ? apiUser.persona?.profile.getList(Array.from(profileSet))?.then((res) => res || []) || []
            : [],
    ]);

    const listed: ItemDetails[] = [];

    items.forEach((item: any) => {
        const profile = profiles.find((element: any) => element.persona === item.id.split('-')[0]);
        let ItemDetails: ItemDetails = {
            item: item,
            avatar: profile?.avatar?.[0] || config.undefinedImageAlt,
            name: profile?.name || formatter(profile?.persona) || '',
        };

        if ('target' in item) {
            // Is auto item
            if (isAsset(item.target.field)) {
                let assetDetails: {
                    name?: string;
                    description?: string | null;
                    image_url?: string | null;
                } = {
                    image_url: config.undefinedImageAlt,
                };

                const asset = details.find(
                    (asset) => asset.id === item.target?.field.substring(7, item.target.field.length),
                );

                if (asset) {
                    if (item.target.field.includes('Gitcoin')) {
                        // handle Gitcoin record
                        let DonationDetails = asset.detail as DonationDetailByGrant;
                        assetDetails = {
                            name: DonationDetails.grant.title,
                            description: DonationDetails.grant.description,
                            image_url: DonationDetails.grant.logo,
                        };
                    } else if (item.target.field.includes('NFT')) {
                        // handle NFT
                        let NFTDetails = asset.detail as NFT;
                        assetDetails = {
                            name: NFTDetails.name,
                            description: NFTDetails.description,
                            image_url:
                                NFTDetails.image_preview_url ||
                                NFTDetails.image_url ||
                                NFTDetails.image_thumbnail_url ||
                                NFTDetails.animation_url ||
                                NFTDetails.animation_original_url,
                        };
                    } else {
                        // handle POAP
                        let POAPDetails = asset.detail as POAP;
                        assetDetails = {
                            name: POAPDetails.name,
                            description: POAPDetails.description,
                            image_url: POAPDetails.image_url,
                        };
                    }
                }

                ItemDetails.details = assetDetails;
            }
        }

        listed.push(ItemDetails);
    });

    return {
        listed: listed,
        haveMore: haveMore,
    };
}

function extractEmbedFields(raw: string, fieldsEmbed: string[]) {
    const fieldPattern = /<([A-Z]+?)#(.+?)>/gi;
    const fields = raw.match(fieldPattern) || [];
    const extracted = raw.replace(fieldPattern, '');
    const fieldsMatch: {
        [key: string]: string;
    } = {};

    for (const field of fields) {
        const splits = fieldPattern.exec(field) || [];
        if (fieldsEmbed.includes(splits[1])) {
            fieldsMatch[splits[1]] = splits[2];
        }
    }

    return {
        extracted,
        fieldsMatch,
    };
}

function fixURLSchemas(url: string) {
    let fixedUrl = url;
    if (url.startsWith('ipfs://')) {
        fixedUrl = url.replace('ipfs://', config.ipfs.download.endpoint + '/');
    }
    return fixedUrl;
}

function setStorage(key: string, value: string) {
    if (typeof window !== 'undefined') {
        if (value) {
            localStorage.setItem(key, value);
        } else {
            localStorage.removeItem(key);
        }
    }
}

function getStorage(key: string): string {
    return typeof window !== 'undefined' ? localStorage.getItem(key) || '{}' : '{}';
}

function replacer(key: any, value: any) {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}

function reviver(key: any, value: any) {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

function strMapToObj(strMap: any) {
    let obj = Object.create(null);
    for (let [k, v] of strMap) {
        obj[k] = v;
    }
    return obj;
}

function objToStrMap(obj: any) {
    let strMap = new Map();
    for (let k of Object.keys(obj)) {
        strMap.set(k, obj[k]);
    }
    return strMap;
}

const utils = {
    sortByOrderTag,
    initAssets,
    loadAssets,
    initAccounts,
    extractEmbedFields,
    initContent,
    fixURLSchemas,
    setStorage,
    getStorage,
    replacer,
    reviver,
    strMapToObj,
    objToStrMap,
};

export default utils;
