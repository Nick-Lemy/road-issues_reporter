import { useState, useRef, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';

export default function BottomSheet({ children, minHeight = 120, maxHeight = null }) {
    const containerRef = useRef(null);
    const [height, setHeight] = useState(minHeight);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startHeight, setStartHeight] = useState(0);

    const actualMaxHeight = maxHeight || window.innerHeight - 100;

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
        setStartHeight(height);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const diff = startY - currentY;
        const newHeight = Math.min(actualMaxHeight, Math.max(minHeight, startHeight + diff));

        setHeight(newHeight);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        // Snap to positions
        const midPoint = (minHeight + actualMaxHeight) / 2;

        if (height < midPoint) {
            setHeight(minHeight);
        } else {
            setHeight(actualMaxHeight);
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartY(e.clientY);
        setStartHeight(height);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const currentY = e.clientY;
            const diff = startY - currentY;
            const newHeight = Math.min(actualMaxHeight, Math.max(minHeight, startHeight + diff));

            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);

            // Snap to positions
            const midPoint = (minHeight + actualMaxHeight) / 2;

            if (height < midPoint) {
                setHeight(minHeight);
            } else {
                setHeight(actualMaxHeight);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, startY, startHeight, height, minHeight, actualMaxHeight]);

    return (
        <div
            ref={containerRef}
            className="bottom-sheet-container"
            style={{
                height: `${height}px`,
                transition: isDragging ? 'none' : 'height 0.3s ease-out'
            }}
        >
            <div
                className="bottom-sheet-handle"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
            >
                <div className="bottom-sheet-grip">
                    <GripHorizontal size={28} />
                </div>
            </div>

            <div className="bottom-sheet-content">
                {children}
            </div>
        </div>
    );
}
