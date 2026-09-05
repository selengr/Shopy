export type WaitlistEntry = {
  id: number;
  productId: number;
  productTitle: string;
  customerName: string;
  customerPhone: string;
  created_at: string;
  /** seller marked as contacted / done */
  done?: boolean;
};
