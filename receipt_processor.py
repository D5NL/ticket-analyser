from datetime import datetime

class ReceiptProcessor:
    def process_receipt(self, receipt, current_status):
        """
        Verwerkt een bon en voegt timestamp toe bij statuswijziging
        """
        if receipt.status != current_status:
            receipt.status_history.append({
                'status': receipt.status,
                'timestamp': datetime.now()
            })
            return True
        return False

    def bulk_process_receipts(self, receipts):
        """
        Verwerkt meerdere bonnen en slaat alleen gewijzigde statussen op
        """
        processed_receipts = []
        for receipt in receipts:
            current_status = receipt.get_current_status()
            if self.process_receipt(receipt, current_status):
                processed_receipts.append(receipt)
        
        return processed_receipts 