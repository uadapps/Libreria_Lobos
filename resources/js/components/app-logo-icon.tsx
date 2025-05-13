import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      src="/images/logologo.png"

      alt="Logo"
    />
  );
}
