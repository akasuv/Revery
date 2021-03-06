import AccountItem from '../accounts/AccountItem';
import EVMpAccountItem from '../accounts/EVMpAccountItem';
import Button from '../buttons/Button';
import { COLORS } from '../buttons/variables';
import { copyToClipboard } from '../../common/address';
import utils from '../../common/utils';

interface SingleAccountProps {
    chain?: string;
    address?: string;
}

export default function SingleAccount({ chain, address }: SingleAccountProps) {
    return (
        <div className="flex items-center flex-col gap-6">
            {chain !== 'EVM+' ? (
                <AccountItem chain={chain} size="lg" />
            ) : (
                <EVMpAccountItem address={address} size="lg" />
            )}
            <span className="w-full px-4 text-lg font-bold text-center break-all">{address}</span>
            <div className="flex flex-row items-center gap-x-2">
                <Button
                    isOutlined={true}
                    color={COLORS.primary}
                    text={'Copy'}
                    onClick={() => {
                        copyToClipboard(address);
                    }}
                />
                <Button
                    isOutlined={false}
                    color={COLORS.primary}
                    icon={'external'}
                    onClick={() => {
                        if (chain && address) {
                            utils.toExternalAccountDetails(chain, address);
                        }
                    }}
                />
            </div>
        </div>
    );
}
