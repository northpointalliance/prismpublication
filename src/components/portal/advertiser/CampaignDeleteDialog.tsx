import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  campaignTitle: string | null;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CampaignDeleteDialog = ({ campaignTitle, open, onConfirm, onCancel }: Props) => (
  <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete "{campaignTitle}"?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove the campaign. Any unspent budget will be refunded to your wallet.
          This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Delete Campaign</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default CampaignDeleteDialog;
