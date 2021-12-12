import { GeneralAsset, GeneralAssetWithTags } from './types';
import config from './config';
import RSS3, { IAssetProfile, IRSS3 } from './rss3';
import { RSS3Account, RSS3Asset } from './rss3Types';
import { utils as RSS3Utils } from 'rss3';
import { id } from 'ethers/lib/utils';
import { AnyObject } from 'rss3/types/extend';
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

const setTaggedOrder = (tagged: TypesWithTag, order?: number): void => {
    if (!tagged.tags) {
        tagged.tags = [];
    } else {
        // const orderPattern = /^pass:order:(-?\d+)$/i;
        const oldIndex = tagged.tags.findIndex((tag) => orderPattern.test(tag));
        if (oldIndex !== -1) {
            tagged.tags.splice(oldIndex, 1);
        }
    }
    if (order) {
        tagged.tags.push(`${config.tags.prefix}:order:${order}`);
    } else {
        tagged.tags.push(`${config.tags.prefix}:${config.tags.hiddenTag}`);
    }
};

function sortByOrderTag<T extends TypesWithTag>(taggeds: T[]): T[] {
    taggeds.sort((a, b) => {
        return getTaggedOrder(a) - getTaggedOrder(b);
    });
    return taggeds;
}

const setOrderTag = async (taggeds: TypesWithTag[]): Promise<TypesWithTag[]> => {
    await Promise.all(
        taggeds.map(async (tagged, index) => {
            setTaggedOrder(tagged, index);
        }),
    );
    return taggeds;
};

const setHiddenTag = async (taggeds: TypesWithTag[]): Promise<TypesWithTag[]> => {
    await Promise.all(
        taggeds.map(async (tagged) => {
            setTaggedOrder(tagged);
        }),
    );
    return taggeds;
};

const mergeAssetsTags = async (assetsInRSS3File: RSS3Asset[], assetsGrabbed: GeneralAsset[]) => {
    return await Promise.all(
        (assetsGrabbed || []).map(async (ag: GeneralAssetWithTags) => {
            const origType = ag.type;
            if (config.hideUnlistedAssets) {
                ag.type = 'Invalid'; // Using as a match mark
            }
            for (const airf of assetsInRSS3File) {
                let asset = RSS3Utils.id.parseAsset(airf);
                if (
                    asset.platform === ag.platform &&
                    asset.identity === ag.identity &&
                    asset.uniqueID === ag.uniqueID &&
                    asset.type === origType
                ) {
                    // Matched
                    ag.type = origType; // Recover type
                    // if (asset.tags) {
                    //     ag.tags = airf.tags;
                    // }
                    break;
                }
            }
            return ag;
        }),
    );
};

interface AssetsList {
    listed: GeneralAssetWithTags[];
    unlisted: GeneralAssetWithTags[];
}

async function initAssets(type?: string, limit?: number) {
    // const listed: GeneralAssetWithTags[] = [];
    // const unlisted: GeneralAssetWithTags[] = [];

    const pageOwner = RSS3.getPageOwner();
    // const assetInRSS3 = (await pageOwner.assets?.auto.getListFile(pageOwner.address)) || [];

    // const assetInAssetProfile = await getAssetProfileWaitTillSuccess(pageOwner.address, type);
    // const allAssets = await utils.mergeAssetsTags(assetInRSS3 ? assetInRSS3 : [''], assetInAssetProfile);

    // for (const asset of assetInRSS3) {
    //     if (asset.type.endsWith(type)) {
    //         if (asset.tags?.includes(`${config.tags.prefix}:${config.tags.hiddenTag}`)) {
    //             unlisted.push(asset);
    //         } else {
    //             listed.push(asset);
    //         }
    //     }
    // }
    async function getAssetDetails(parsedAssetList: AnyObject[]) {
        const assetIDList = parsedAssetList.map((asset) =>
            RSS3Utils.id.getAsset(asset.platform, asset.identity, asset.type, asset.uniqueID),
        );
        const assetDetails = await pageOwner.assets?.getDetails({
            persona: pageOwner.address,
            assets: assetIDList ? assetIDList : [''],
            full: true,
        });
        console.log(assetDetails);
        if (assetDetails) {
            return assetDetails;
        } else {
            return [];
        }
    }
    const assetList = await pageOwner.assets?.auto.getList(pageOwner.address);
    // console.log('assets?.auto.getListFile');
    // console.log(assetList);

    const taggedList = (await pageOwner.files.get(pageOwner.address))._pass.assets;
    // console.log('RSS3APIPersona.files.get');
    // console.log(taggedList);

    // const assetDetails = await pageOwner.assets?.getDetails({
    //     persona: pageOwner.address,
    //     assets: assetList?assetList:[''],
    //     full:true
    //     });
    // console.log('RSS3APIPersona.assets?.getDetails');
    // console.log(assetDetails);

    const parsedAssets = assetList?.map((asset) => RSS3Utils.id.parseAsset(asset));
    // console.log(parsedAssets)
    const nfts = parsedAssets?.filter((asset) => asset.type.split('.')[1] === 'NFT');
    // console.log('nfts')
    // console.log(nfts)
    const donations = parsedAssets?.filter((asset) => asset.type.split('.')[1] === 'Donation');
    const footprints = parsedAssets?.filter((asset) => asset.type.split('.')[1] === 'POAP');

    let nftDetails: AnyObject[] = [];
    let donationDetails: AnyObject[] = [];
    let footprintDetails: AnyObject[] = [];

    if (nfts && nfts.length > 0) nftDetails = await getAssetDetails(nfts);
    if (donations && donations.length > 0) donationDetails = await getAssetDetails(donations);
    if (footprints && footprints.length > 0) footprintDetails = await getAssetDetails(footprints);
    return {
        nfts: nftDetails,
        donations: donationDetails,
        footprints: footprintDetails,
    };
}

async function getAssetProfileWaitTillSuccess(address: string, type: string, delay: number = 500) {
    return new Promise<GeneralAsset[]>(async (resolve, reject) => {
        const tryReq = async () => {
            try {
                const assetProfileRes = await RSS3.getAssetProfile(address, type);
                if (assetProfileRes?.status) {
                    resolve(assetProfileRes?.assets || []);
                }
                return true;
            } catch (e) {
                reject(e);
            }
            return false;
        };

        if (!(await tryReq())) {
            let iv = setInterval(async () => {
                if (await tryReq()) {
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
    let condition = ['NFT', 'POAP'];
    if (field && condition.find((item) => field.includes(item))) {
        return true;
    }
    return false;
}

async function initContent(timestamp: string = '') {
    let assetSet = new Set<string>();
    let profileSet = new Set<string>();
    let haveMore = true;
    const apiUser = await RSS3.getAPIUser();
    const pageOwner = await RSS3.getPageOwner();

    const items =
        (await pageOwner.items?.getListByPersona({
            persona: pageOwner.address,
            limit: 30,
            tsp: timestamp,
        })) || [];

    haveMore = items.length === 30;

    profileSet.add(pageOwner.address);
    items.forEach((item) => {
        if (isAsset(item.target?.field)) {
            assetSet.add(item.target?.field.substring(7, item.target.field.length));
        }
        profileSet.add(item.id.split('-')[0]);
    });

    const details =
        assetSet.size !== 0
            ? (await pageOwner.assets?.getDetails({
                  persona: pageOwner.address,
                  assets: Array.from(assetSet),
                  full: true,
              })) || []
            : [];

    const profiles =
        profileSet.size !== 0 ? (await apiUser.persona?.profile.getList(Array.from(profileSet))) || [] : [];

    const listed: any[] = [];
    items.forEach((item) => {
        let temp: any;

        const profile = profiles.find((element: any) => {
            element.persona === item.id.split('-')[0];
        }) || {
            avatar: pageOwner.profile?.avatar,
            name: pageOwner.name,
        };

        temp = {
            ...item,
            avatar: profile.avatar[0] || config.undefinedImageAlt,
            username: profile.name,
        };

        if (isAsset(item.target?.field)) {
            const asset = details.find(
                (asset) => asset.id === item.target?.field.substring(7, item.target.field.length),
            );

            if (asset) {
                listed.push({
                    ...temp,
                    details: {
                        ...asset,
                    },
                });
            }
        } else {
            listed.push({ ...temp });
        }
    });
    console.log(listed);
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

const utils = {
    sortByOrderTag,
    setOrderTag,
    setHiddenTag,
    mergeAssetsTags,
    initAssets,
    initAccounts,
    extractEmbedFields,
    initContent,
};

export default utils;
