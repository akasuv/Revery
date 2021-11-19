import React from 'react';
import MarketTag from '../tags/MarketTag';
import ScanTag from '../tags/ScanTag';
import Trait from './Trait';
import { NFT } from '../../common/types';
import style from '../../styles/content.module.css';
import { Markdown } from 'react-marked-renderer';

interface NFTDetailProps {
    detail: NFT;
    market: 'opensea' | 'rarible';
}

export default function NFTDetail({ detail, market }: NFTDetailProps) {
    const subtitle = 'text-lg font-medium capitalize text-nft my-2';

    return (
        <div className="flex flex-col items-start justify-start gap-5 filter">
            <h2 className="overflow-hidden text-xl font-semibold capitalize break-all overflow-ellipsis">
                {detail.name + ' #' + detail.token_id}
            </h2>
            <div className="flex flex-row flex-wrap gap-2.5 items-center justify-start">
                <MarketTag market={market} />
                <ScanTag chain={detail.chain} />
            </div>
            {detail.description && (
                <div>
                    <h3 className={subtitle}>Description</h3>
                    <div className={style.content}>
                        <Markdown markdown={detail.description} />
                    </div>
                </div>
            )}
            {detail.traits && detail.traits.length > 0 && (
                <div>
                    <h3 className={subtitle}>Properties</h3>
                    <div className="flex flex-row flex-wrap gap-2.5 items-center justify-start mt-3">
                        {detail.traits.map((item, index) => (
                            <Trait traitType={item.trait_type} traitValue={item.value} key={index} />
                        ))}
                    </div>
                </div>
            )}
            {detail.collection?.description && (
                <div>
                    <h3 className={subtitle}>About {detail.collection?.name}</h3>
                    <div className={style.content}>
                        <Markdown markdown={detail.collection?.description} />
                    </div>
                </div>
            )}
        </div>
    );
}
