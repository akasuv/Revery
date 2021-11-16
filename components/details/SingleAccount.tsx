import AccountItem from '../accounts/AccountItem';
import EVMpAccountItem from '../accounts/EVMpAccountItem';
import Button from '../buttons/Button';
import { COLORS } from '../buttons/variables';

interface SingleAccountProps {
    chain: string;
    address: string;
}

export default function SingleAccount({ chain, address }: SingleAccountProps) {
    return (
        <>
            {chain !== 'EVM+' ? (
                <AccountItem chain={chain} outline="account" />
            ) : (
                <EVMpAccountItem address={address} size="lg" />
            )}
            <span className="w-full text-lg font-bold text-center truncate">{address}</span>
            <div className="flex flex-row items-center gap-x-2">
                <Button isOutlined={true} color={COLORS.donation} text={'Copy'} />
                <Button isOutlined={false} color={COLORS.account} icon={'external'} />
            </div>
        </>
    );
}