class Receipt:
    def __init__(self):
        self.status = None
        self.status_history = []
    
    def get_current_status(self):
        """
        Haalt de huidige status op uit de geschiedenis
        """
        if self.status_history:
            return self.status_history[-1]['status']
        return None 