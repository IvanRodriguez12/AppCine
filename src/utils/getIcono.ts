export const getIcono = (nombre: string) => {
  switch (nombre) {
    case 'lollipop.png': return require('../assets/images/lollipop.png');
    case 'combo.png': return require('../assets/images/combo.png');
    case 'popcorn.png': return require('../assets/images/popcorn.png');
    case 'ticket.png': return require('../assets/images/ticket.png');
    default: return require('../assets/images/default.png');
  }
};
