import React from 'react';
import ImageHolder from '../ImageHolder';
import LinkButton from '../buttons/LinkButton';
import { BiUserCheck, BiUserPlus } from 'react-icons/bi';
export interface UserItems {
    username: string;
    avatarUrl: string;
    bio: string;
    ethAddress: string;
    rns: string;
}

interface UserItemProps extends UserItems {
    toUserPage?: (addrOrName: string) => void;
}

const UserCard = ({ username, avatarUrl, bio, ethAddress, rns, toUserPage }: UserItemProps) => {
    // Setup user address
    // using rss3.bio or other things maybe
    const address = rns ? `${rns}` : `${ethAddress.slice(0, 6)}...${ethAddress.slice(-4)}`;

    const [isAvatarFullRounded, setIsAvatarFullRounded] = React.useState(true);

    return (
        <div
            className={`flex flex-row gap-2 justify-start py-2 bg-transparent ${
                toUserPage ? 'cursor-pointer' : ''
            } bg-white transition-all duration-100 ease-in-out`}
            onClick={() => {
                if (toUserPage) {
                    toUserPage(rns || ethAddress);
                }
            }}
            onMouseEnter={() => setIsAvatarFullRounded(false)}
            onMouseLeave={() => setIsAvatarFullRounded(true)}
        >
            <section className="animate-fade-in flex flex-row items-center flex-shrink-0 h-10 w-10">
                <ImageHolder
                    imageUrl={avatarUrl}
                    roundedClassName={isAvatarFullRounded ? 'rounded-half' : 'rounded-xl'}
                    size={36}
                />
            </section>
            <section className="animate-fade-in flex flex-col flex-grow">
                <div className="flex flex-row items-center gap-1.5">
                    <span
                        className={`flex-1 w-0 truncate max-w-max ${
                            isAvatarFullRounded ? 'font-semibold' : 'font-bold'
                        } text-sm`}
                    >
                        {username}
                    </span>
                    <LinkButton key={address} text={address} />
                </div>
                <div className="flex flex-row">
                    <span className="flex-1 w-0 truncate text-xs leading-5">{bio}</span>
                </div>
            </section>
            <section className="animate-fade-in flex flex-row items-center text-primary text-opacity-50 text-lg">
                <BiUserPlus />
            </section>
        </div>
    );
};

export default UserCard;
