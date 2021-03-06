import React from 'react';
import { copyToClipboard, formatter } from '../../common/address';
import Button from '../buttons/Button';
import { COLORS } from '../buttons/variables';
import AccountItem from './AccountItem';
import EVMpAccountItem from './EVMpAccountItem';
import utils from '../../common/utils';

interface AccountCardProps {
    size?: string;
    chain: string;
    address: string;
    clickEvent?: () => void;
}

const AccountCard = ({ size = 'lg', chain, address, clickEvent }: AccountCardProps) => {
    return (
        <section className="grid items-center grid-cols-3 cursor-pointer gap-6" onClick={clickEvent}>
            {chain !== 'EVM+' ? (
                <AccountItem size={size} chain={chain} outline="account" />
            ) : (
                <EVMpAccountItem size={size} address={address} outline="account" />
            )}
            <div className="text-lg font-bold text-left">{formatter(address)}</div>
            <div className="flex flex-row items-center gap-x-2">
                <Button
                    isOutlined={true}
                    color={COLORS.primary}
                    text={'Copy'}
                    onClick={(e: any) => {
                        copyToClipboard(address);
                        e.stopPropagation();
                    }}
                />
                <Button
                    isOutlined={false}
                    color={COLORS.primary}
                    icon={'external'}
                    onClick={(e: any) => {
                        if (chain && address) {
                            utils.toExternalAccountDetails(chain, address);
                        }
                        e.stopPropagation();
                    }}
                />
            </div>
        </section>
    );
};

export default AccountCard;
