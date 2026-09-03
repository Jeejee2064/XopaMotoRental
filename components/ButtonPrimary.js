import { Link } from '../navigation';

// Flat cyan CTA — no gradients, per the XOPA brand guide. Magenta stays
// reserved for the logo mark; it's not used in UI accents/CTAs.
export default function ButtonPrimary({ href, text, external = false }) {
  const className =
    'inline-block px-8 py-4 bg-cyan text-noir font-heading font-bold text-lg uppercase tracking-wide hover:bg-jaune hover:text-noir transition-colors duration-200';

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {text}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}
