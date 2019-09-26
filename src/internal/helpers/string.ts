export const basename = (fullname: string): string =>
  fullname.replace(/^[\s\S]*\/(?=[^/]*$)/, '');
