import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
return (
    <>
        <div className="bg-white flex aspect-square size-8 items-center justify-center rounded-md">
            <AppLogoIcon className="size-7" />
        </div>
        <div className="ml-1 grid flex-1 text-left text-sm">
            <span className="mb-0.5 truncate leading-none font-semibold">Libreria Lobos</span>
        </div>
    </>
);
}
