import React from 'react';
import Button from '../buttons/Button';
import { COLORS } from '../buttons/variables';
import AccountItem from './AccountItem';
import EVMpAccountItem from './EVMpAccountItem';

interface AccountCardProps {
    size?: string;
    chain: string;
    address: string;
    clickEvent?: () => void;
}

const formatter = (address: string): string => {
    return address.length > 14 ? `${address.slice(0, 6)}....${address.slice(-4)}` : address;
};

const AccountCard = ({ size = 'lg', chain, address, clickEvent = () => {} }: AccountCardProps) => {
    return (
        <section className="grid items-center grid-cols-3 cursor-pointer" onClick={clickEvent}>
            {chain !== 'EVM+' ? (
                <AccountItem size={size} chain={chain} outline="account" />
            ) : (
                <EVMpAccountItem size={size} address={address} outline="account" />
            )}
            <span className="text-lg font-bold text-left">{formatter(address)}</span>
            <div className="flex flex-row items-center gap-x-2">
                <Button isOutlined={true} color={COLORS.donation} text={'Copy'} />
                <Button isOutlined={false} color={COLORS.account} icon={'external'} />
            </div>
        </section>
    );
};

export default AccountCard;