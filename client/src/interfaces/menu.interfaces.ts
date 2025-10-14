import type { ComputedRef } from 'vue';

interface IMenuItem {
  label: string;
  icon: string;
  to: string | null;
  desc?: string;
  expanded?: boolean;
  items?: IMenuItem[] | ComputedRef<IMenuItem[]>;
  customClass?: string;
  customStyle?: string;
  badge?: number | null;
}


export type { IMenuItem };
