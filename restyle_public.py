import re

with open('views/PublicDisplayView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    r'#0A84FF': '10b981', # emerald-500 hex
    r'#007AFF': '10b981',
    r'bg-\[\#007AFF\]': 'bg-emerald-500',
    r'text-\[\#0A84FF\]': 'text-emerald-500',
    r'border-\[\#0A84FF\]': 'border-emerald-500',
    r'bg-\[\#1D1D1F\]': 'bg-[#0a0a0a]',
    r'bg-\[\#1C1C1E\]': 'bg-white/5',
    r'bg-\[\#2C2C2E\]': 'bg-white/10',
    r'bg-\[\#050505\]': 'bg-[#050505]',
}

# Fix full screen announcement
content = content.replace('border-[#0A84FF]/30', 'border-emerald-500/30')
content = content.replace('text-[#0A84FF]', 'text-emerald-500')
content = content.replace('border-[#0A84FF]', 'border-emerald-500')
content = content.replace('bg-[#0A84FF]', 'bg-emerald-500')
content = content.replace('ring-[#007AFF]', 'ring-emerald-500')
content = content.replace('bg-[#007AFF]', 'bg-emerald-500')
content = content.replace('text-[#007AFF]', 'text-emerald-500')
content = content.replace('border-[#007AFF]', 'border-emerald-500')
content = content.replace('bg-blue-500', 'bg-emerald-500')
content = content.replace('border-blue-500', 'border-emerald-500')
content = content.replace('ring-blue-500', 'ring-emerald-500')
content = content.replace('text-blue-500', 'text-emerald-500')

# News ticker
content = content.replace('bg-[#007AFF] flex items-center overflow-hidden border-t-2 border-white/20 shadow-[0_-10px_30px_rgba(0,122,255,0.2)]', 'bg-[#050505] flex items-center overflow-hidden border-t border-white/10')
content = content.replace('text-white text-xl font-black uppercase tracking-[0.3em]', 'text-emerald-500/50 text-xl font-black uppercase tracking-[0.3em]')

# Backgrounds
content = content.replace('bg-[#000]', 'bg-[#050505]')
content = content.replace('bg-[#F5F5F7]', 'bg-[#050505]')
content = content.replace('bg-[#1D1D1F]', 'bg-[#0a0a0a]')
content = content.replace('bg-[#1C1C1E]', 'bg-white/5')

# Theme styles update
theme_styles_regex = r'const themeStyles = \{[\s\S]*?    \}[\s\S]*?\};'
premium_themes = """const themeStyles = {
    light: {
      bg: 'bg-[#050505]',
      card: 'bg-[#0a0a0a] border border-white/5',
      header: 'bg-[#0a0a0a] border-b border-white/5 text-white',
      text: 'text-white',
      sub: 'text-white/50',
      accent: 'text-emerald-400',
      row: 'bg-[#0a0a0a] border-white/5',
      rowAlt: 'bg-white/5 border-white/5',
    },
    dark: {
      bg: 'bg-[#050505]',
      card: 'bg-[#0a0a0a] border border-white/5',
      header: 'bg-[#0a0a0a] border-b border-white/5 text-white',
      text: 'text-white',
      sub: 'text-white/50',
      accent: 'text-emerald-400',
      row: 'bg-[#0a0a0a] border-white/5',
      rowAlt: 'bg-white/5 border-white/5',
    },
    titanium: {
      bg: 'bg-[#050505]',
      card: 'bg-[#0a0a0a] border border-white/5',
      header: 'bg-[#0a0a0a] border-b border-white/5 text-white',
      text: 'text-white',
      sub: 'text-white/50',
      accent: 'text-emerald-400',
      row: 'bg-[#0a0a0a] border-white/5',
      rowAlt: 'bg-white/5 border-white/5',
    }
  };"""
content = re.sub(theme_styles_regex, premium_themes, content)


with open('views/PublicDisplayView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
