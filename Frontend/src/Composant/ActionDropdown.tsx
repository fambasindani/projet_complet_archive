// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaEllipsisV } from 'react-icons/fa';

interface ActionDropdownProps {
  children: React.ReactNode;
  width?: string;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ children, width = 'w-52' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < menuHeight + 8;

      setPosition({
        top: openAbove ? rect.top - menuHeight - 4 : rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 230),
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => { setIsOpen(false); };
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef} className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
        >
          <FaEllipsisV className="text-xs" />
        </button>
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={`fixed ${width} z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl`}
          style={{ top: position.top, left: position.left }}
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  onClick: (...args: any[]) => {
                    setIsOpen(false);
                    if (typeof (child.props as any).onClick === 'function') {
                      (child.props as any).onClick(...args);
                    }
                  },
                })
              : child
          )}
        </div>
      )}
    </>
  );
};

export default ActionDropdown;
