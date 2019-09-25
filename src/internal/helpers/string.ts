export const basename = (fullname: string) =>
  fullname.replace(/^[\s\S]*\/(?=[^/]*$)/, '');
