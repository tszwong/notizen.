declare module 'quill-better-table' {
  import { Quill } from 'quill';
  
  interface QuillBetterTableOptions {
    operationMenu?: {
      items?: {
        [key: string]: {
          text?: string;
        };
      };
    };
  }

  class QuillBetterTable {
    constructor(quill: Quill, options?: QuillBetterTableOptions);
    static keyboardBindings: any;
  }

  export default QuillBetterTable;
} 