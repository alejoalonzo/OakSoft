"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

export default function TokenSelect({
  list = [],
  value = null,                     
  onChange,                         
  placeholder = "Select token…",
  hideItem,                         
  getIcon,                          
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click /ESC
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((it) => !hideItem?.(it))
      .filter((it) => {
        if (!q) return true;
        const code = it?.code?.toLowerCase() || "";
        const net = it?.network?.toLowerCase() || "";
        const name = it?.name?.toLowerCase() || "";
        return code.includes(q) || net.includes(q) || name.includes(q);
      });
  }, [list, query, hideItem]);

  // Open/close
  const openMenu = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Ensure the active item is in view
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, filtered.length]);

  // Keyboard on button
  function onButtonKeyDown(e) {
    if (disabled) return;
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
      setActiveIndex(0);
    }
  }

  // Keyboard on menu
  function onMenuKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      btnRef.current?.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(Math.max(filtered.length - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) {
        onChange?.(item);
        closeMenu();
        btnRef.current?.focus();
      }
    }
  }

  function tokenImg(item) {
    const url = getIcon?.(item) || item?.logo;
    const letter = (item?.code?.[0] || "?").toUpperCase();
    return (
      <img
        src={url || `https://via.placeholder.com/24/6B7280/FFFFFF?text=${letter}`}
        alt={item?.code || "token"}
        className="w-5 h-5 rounded-full"
        onError={(e) => {
          e.currentTarget.src = `https://via.placeholder.com/24/6B7280/FFFFFF?text=${letter}`;
        }}
      />
    );
  }

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      {/* Button / value */}
      <button
        type="button"
        ref={btnRef}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-gray-600/20"}
        bg-[#323841] text-[#E6EDE4]`}
      >
        {value ? (
          <>
            {tokenImg(value)}
            <div className="flex items-center gap-2 flex-1 text-left">
              <span className="font-medium">{value.code}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{backgroundColor: '#151A23'}}>
                {value.network}
              </span>
            </div>
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Menu */}
      {open && (
        <div
          role="listbox"
          aria-activedescendant={`ts-item-${activeIndex}`}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="absolute z-50 mt-4 -left-3 -right-3 rounded-xl border border-[#95E100] bg-gray-800/95 backdrop-blur-sm shadow-2xl"
        >
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search…"
              className="w-full px-3 py-2 rounded-md bg-gray-700/60 text-white placeholder-gray-400 outline-none"
            />
          </div>

          {/* List */}
          <ul ref={listRef} className="max-h-72 overflow-auto py-1 scroll-trans">
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-gray-400">No results</li>
            )}
            {filtered.map((item, idx) => {
              const selected = item?.code === value?.code && item?.network === value?.network;
              const active = idx === activeIndex;
              return (
                <li
                  id={`ts-item-${idx}`}
                  key={`${item.code}-${item.network}-${idx}`}
                  data-idx={idx}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onChange?.(item);
                    closeMenu();
                    btnRef.current?.focus();
                  }}
                  className={`px-3 py-2 flex items-center gap-3 text-sm cursor-pointer
                    ${active ? "bg-gray-700/60" : "bg-transparent"}
                    ${selected ? "font-semibold" : "font-normal"}
                    hover:bg-gray-700/60`}
                >
                  {tokenImg(item)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#E6EDE4]">{item.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{backgroundColor: '#151A23'}}>{item.network}</span>
                    </div>
                    {item?.name && (
                      <div className="text-[11px] text-gray-400">{item.name}</div>
                    )}
                  </div>
                  {selected && (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
