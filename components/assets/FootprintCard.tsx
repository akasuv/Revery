import React from 'react';
import ImageHolder from '../ImageHolder';
import { BiCalendar, BiLocationPlus } from 'react-icons/bi';

interface FootprintProps {
    imageUrl: string;
    startDate: string;
    endDate: string;
    city: string;
    country: string;
    username: string;
    activity: string;
}

const formatDate = (ts: string): string => {
    return new Date(parseInt(ts) * 1000).toLocaleDateString('en-US');
};

const FootprintCard = ({ imageUrl, startDate, endDate, city, country, username, activity }: FootprintProps) => {
    // Calc display date
    let displayDate = formatDate(startDate);
    if (endDate !== startDate) {
        displayDate += ' ~ ' + formatDate(endDate);
    }

    // Calc location
    const location = city || country || 'Metaverse';

    return (
        <div className="flex flex-row gap-2 justify-start p-4">
            <section className="flex flex-row w-max h-max flex-shrink-0">
                <ImageHolder imageUrl={imageUrl} isFullRound={true} size={76} />
            </section>
            <section className="flex flex-1 flex-col justify-around text-body-text text-sm leading-normal">
                <div className="flex flex-row gap-2 items-center">
                    <BiCalendar className="text-footprint" />
                    <span className="flex-1 w-0 truncate">{displayDate}</span>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <BiLocationPlus className="text-footprint" />
                    <span className="flex-1 w-0 truncate">{location}</span>
                </div>
                <div className="flex flex-row gap-2 font-medium">
                    <div className="text-footprint">{username} attended</div>
                    <div className="flex-1 w-0 truncate">{activity}</div>
                </div>
            </section>
        </div>
    );
};

export default FootprintCard;