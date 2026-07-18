import React from "react";

interface BruxosLogoProps {
  className?: string;
  size?: number;
}

export const BruxosLogo: React.FC<BruxosLogoProps> = ({
  className = "",
  size = 64,
}) => {
  return (
    <svg
      id="bruxos-vfx-logo"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      className={`${className} select-none`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background shape / Purple big triangle (bottom right) */}
      <path
        id="bg-purple-triangle"
        d="M550 760 L900 890 L800 660 Z"
        fill="#732082"
      />

      {/* Top Cross (+) */}
      <path
        id="top-cross"
        d="M380 44 H412 V116 H484 V148 H412 V220 H380 V148 H308 V116 H380 Z"
        fill="#732082"
      />

      {/* Bottom Cross (+) */}
      <path
        id="bottom-cross"
        d="M480 804 H512 V876 H584 V908 H512 V980 H480 V908 H408 V876 H480 Z"
        fill="#732082"
      />

      {/* Left Purple Circle */}
      <circle id="left-circle" cx="130" cy="390" r="66" fill="#732082" />

      {/* Left-Bottom Sharp Purple Slanted Polygon */}
      <path
        id="left-slanted-poly"
        d="M72 584 L400 320 L350 490 L160 616 Z"
        fill="#732082"
      />

      {/* Right Tall Purple Wedge */}
      <path
        id="right-tall-wedge"
        d="M624 160 L692 72 L788 456 L724 444 Z"
        fill="#732082"
      />

      {/* Right Three Small Stacked Purple Triangles */}
      <g id="right-stacked-triangles">
        {/* Triangle 1 */}
        <path d="M800 280 L848 316 L832 284 Z" fill="#732082" />
        {/* Triangle 2 */}
        <path d="M828 328 L876 364 L860 332 Z" fill="#732082" />
        {/* Triangle 3 */}
        <path d="M856 376 L904 412 L888 380 Z" fill="#732082" />
      </g>

      {/* Green Witch Hat (Middle-Right part) */}
      {/* The Hat base/back curve */}
      <path
        id="green-hat-body"
        d="M604 16 L490 280 Q430 450 640 496 Q700 400 604 16 Z"
        fill="#8cc63f"
      />

      {/* White lines cutouts inside the hat */}
      <path
        d="M604 16 Q534 160 480 230"
        stroke="#111"
        strokeWidth="10"
        strokeLinecap="round"
        className="stroke-gray-900 dark:stroke-slate-900"
      />
      <path
        d="M570 120 Q500 280 430 360"
        stroke="#111"
        strokeWidth="12"
        strokeLinecap="round"
        className="stroke-gray-900 dark:stroke-slate-900"
      />
      <path
        d="M550 220 Q480 390 424 456"
        stroke="#111"
        strokeWidth="14"
        strokeLinecap="round"
        className="stroke-gray-900 dark:stroke-slate-900"
      />

      {/* Sweeping Green Brim / Crescent at the bottom */}
      <path
        id="green-sweeping-brim"
        d="M96 706 C250 820 700 800 964 524 C850 670 450 780 96 706 Z"
        fill="#8cc63f"
      />

      {/* Under Hat Brim Inner Green Segment */}
      <path
        id="inner-brim-detail"
        d="M400 532 C490 560 620 540 680 496 C560 480 440 500 400 532 Z"
        fill="#8cc63f"
      />

      {/* Green Buckle / Circle Ornament with cutout at the base of the hat */}
      <circle
        id="green-buckle"
        cx="616"
        cy="528"
        r="42"
        fill="#8cc63f"
      />
      {/* Cutout / 'C' shape representing the buckle interior */}
      <path
        id="green-buckle-c-shape"
        d="M624 512 A 16 16 0 1 0 624 544"
        stroke="#111"
        strokeWidth="10"
        strokeLinecap="round"
        className="stroke-gray-900 dark:stroke-slate-900"
      />
    </svg>
  );
};
