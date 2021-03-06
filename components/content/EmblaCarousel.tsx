/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Thumb } from './EmblaCarouselThumb';
import style from '../../styles/embla.module.css';

const EmblaCarousel = ({ slides }: any) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mainViewportRef, embla] = useEmblaCarousel({ skipSnaps: false });
    const [thumbViewportRef, emblaThumbs] = useEmblaCarousel({
        containScroll: 'keepSnaps',
        selectedClass: '',
        dragFree: true,
    });

    const onThumbClick = useCallback(
        (index) => {
            if (!embla || !emblaThumbs) return;
            if (emblaThumbs.clickAllowed()) embla.scrollTo(index);
        },
        [embla, emblaThumbs],
    );

    const onSelect = useCallback(() => {
        if (!embla || !emblaThumbs) return;
        setSelectedIndex(embla.selectedScrollSnap());
        emblaThumbs.scrollTo(embla.selectedScrollSnap());
    }, [embla, emblaThumbs, setSelectedIndex]);

    useEffect(() => {
        if (!embla) return;
        onSelect();
        embla.on('select', onSelect);
    }, [embla, onSelect]);

    return slides.length === 1 ? (
        <div className="aspect-w-16 aspect-h-9 mt-3">
            <img src={slides[0]} alt={slides[0]} className="object-cover w-full h-full cursor-pointer" />
        </div>
    ) : (
        <div
            onClick={(e: any) => {
                e.stopPropagation();
            }}
        >
            <div className="relative max-w-screen-md min-w-full mx-auto mt-3 bg-white">
                <div className="w-full overflow-hidden" ref={mainViewportRef}>
                    <div className={style.embla__container}>
                        {slides.map((imgSrc: string, index: number) => (
                            <div className="pl-2.5 min-w-full relative" key={index}>
                                <div className="relative overflow-hidden aspect-w-16 aspect-h-9">
                                    <img src={imgSrc} alt={imgSrc} className="object-cover cursor-grab" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className={`relative max-w-screen-md mx-auto bg-white w-full pt-0`}>
                <div className="w-full overflow-hidden" ref={thumbViewportRef}>
                    <div className={`${style.embla__container} ${style.embla__container__thumb}`}>
                        {slides.map((imgSrc: string, index: number) => (
                            <Thumb
                                onClick={(e: any) => {
                                    onThumbClick(index);
                                }}
                                imgSrc={imgSrc}
                                key={index}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmblaCarousel;
