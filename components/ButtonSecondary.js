import { Link } from '../navigation';

// Flat outline button. theme="dark" = sits on a black section (jaune outline),
// theme="light" = sits on a white/light section (noir outline).
export default function ButtonSecondary({ href, text, theme = 'dark', external = false }) {
  const styles =
    theme === 'dark'
      ? 'border-jaune text-jaune hover:bg-jaune hover:text-noir'
      : 'border-noir text-noir hover:bg-noir hover:text-white';

  const className = `inline-block px-8 py-4 bg-transparent border-2 font-heading font-bold text-lg uppercase tracking-wide transition-colors duration-200 ${styles}`;

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
