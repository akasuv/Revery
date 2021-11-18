import { POAPResponse } from '../../common/types';
import FootprintDetail from './FootprintDetail';

export default function SingleFootprint(props: { POAPInfo: POAPResponse }) {
    let { POAPInfo } = props;

    const ImgStyle = {
        backgroundImage: `url(${POAPInfo.data.event.image_url})`,
    };

    return (
        <div className="flex flex-col max-w-screen-sm m-auto gap-y-4">
            <div
                className="w-full bg-center bg-no-repeat bg-cover rounded-full aspect-w-1 aspect-h-1"
                style={ImgStyle}
            />
            <FootprintDetail detail={POAPInfo.data} />
        </div>
    );
}
