'use client';

import { motion } from 'framer-motion';

// Shared fade-up-on-scroll building blocks. Kept as small client components
// so server-component pages can import them directly without going client
// themselves — only these wrappers pay the 'use client' cost.

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }
  })
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

// Single element that fades up once it scrolls into view.
export function Reveal({ children, className, delay = 0, as = 'div', ...props }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      custom={delay}
      variants={fadeUp}
      className={className}
      {...props}
    >
      {children}
    </Comp>
  );
}

// Container that staggers its StaggerItem children's fade-up as it enters view.
export function Stagger({ children, className, as = 'div', ...props }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </Comp>
  );
}

// Child of Stagger — inherits the "show" trigger from its parent, no own viewport logic.
export function StaggerItem({ children, className, as = 'div', ...props }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp variants={fadeUp} className={className} {...props}>
      {children}
    </Comp>
  );
}
