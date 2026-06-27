import { Mark, mergeAttributes } from '@tiptap/core';

export interface WikilinkOptions {
  HTMLAttributes: Record<string, any>;
  onClick?: (title: string) => void;
}

export const Wikilink = Mark.create<WikilinkOptions>({
  name: 'wikilink',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'text-primary underline decoration-primary/30 underline-offset-2 cursor-pointer font-medium hover:decoration-primary',
      },
      onClick: undefined,
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="wikilink"]',
      },
    ];
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'wikilink' }), 0];
  },

  addCommands() {
    return {
      setWikilink: (title: string) => ({ commands }) => {
        return commands.setMark(this.name, { title });
      },
      toggleWikilink: (title: string) => ({ commands }) => {
        return commands.toggleMark(this.name, { title });
      },
      unsetWikilink: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
  
  // A naive auto-linker for [[...]]
  // For a robust implementation, use `addInputRules` and `addPasteRules`.
});
