export interface NoteColorOption {
  id: string;
  name: string;
  bg: string;
  border: string;
  hoverBorder: string;
  darkBg: string;
  darkBorder: string;
  darkHoverBorder: string;
}

export const NOTE_COLORS: readonly NoteColorOption[] = [
  {
    id: 'default',
    name: 'Varsayılan',
    bg: '#FFFFFF',
    border: '#E8E4DE',
    hoverBorder: '#C8C4BE',
    darkBg: '#272730',
    darkBorder: '#3F3F4E',
    darkHoverBorder: '#525266',
  },
  {
    id: 'yellow',
    name: 'Pastel Sarı',
    bg: '#FEF9C3',
    border: '#FDE047',
    hoverBorder: '#EAB308',
    darkBg: '#3E371C',
    darkBorder: '#635626',
    darkHoverBorder: '#857434',
  },
  {
    id: 'green',
    name: 'Pastel Yeşil',
    bg: '#DCFCE7',
    border: '#86EFAC',
    hoverBorder: '#22C55E',
    darkBg: '#1C3829',
    darkBorder: '#2E5E43',
    darkHoverBorder: '#3C7B58',
  },
  {
    id: 'blue',
    name: 'Pastel Mavi',
    bg: '#DBEAFE',
    border: '#93C5FD',
    hoverBorder: '#3B82F6',
    darkBg: '#1D3252',
    darkBorder: '#2E5083',
    darkHoverBorder: '#3D68A8',
  },
  {
    id: 'pink',
    name: 'Pastel Pembe',
    bg: '#FCE7F3',
    border: '#F472B6',
    hoverBorder: '#EC4899',
    darkBg: '#441F38',
    darkBorder: '#6B3158',
    darkHoverBorder: '#8A3F71',
  },
  {
    id: 'purple',
    name: 'Pastel Mor',
    bg: '#F3E8FF',
    border: '#D8B4FE',
    hoverBorder: '#A855F7',
    darkBg: '#36234D',
    darkBorder: '#5A3882',
    darkHoverBorder: '#764AA8',
  },
  {
    id: 'orange',
    name: 'Pastel Turuncu',
    bg: '#FFEDD5',
    border: '#FDBA74',
    hoverBorder: '#F97316',
    darkBg: '#462916',
    darkBorder: '#734324',
    darkHoverBorder: '#98582F',
  },
  {
    id: 'teal',
    name: 'Pastel Turkuaz',
    bg: '#CCFBF1',
    border: '#5EEAD4',
    hoverBorder: '#14B8A6',
    darkBg: '#153835',
    darkBorder: '#235D57',
    darkHoverBorder: '#2E7B73',
  },
] as const;

export function getNoteColor(colorHex?: string, isDark: boolean = false): {
  bg: string;
  border: string;
  hoverBorder: string;
} {
  if (!colorHex || colorHex === '#FFFFFF') {
    const def = NOTE_COLORS[0]!;
    return {
      bg: isDark ? def.darkBg : def.bg,
      border: isDark ? def.darkBorder : def.border,
      hoverBorder: isDark ? def.darkHoverBorder : def.hoverBorder,
    };
  }

  const found = NOTE_COLORS.find(
    (c) =>
      c.bg.toLowerCase() === colorHex.toLowerCase() ||
      c.darkBg.toLowerCase() === colorHex.toLowerCase(),
  );

  if (found) {
    return {
      bg: isDark ? found.darkBg : found.bg,
      border: isDark ? found.darkBorder : found.border,
      hoverBorder: isDark ? found.darkHoverBorder : found.hoverBorder,
    };
  }

  return {
    bg: colorHex,
    border: isDark ? '#3F3F4E' : '#E8E4DE',
    hoverBorder: isDark ? '#525266' : '#C8C4BE',
  };
}
