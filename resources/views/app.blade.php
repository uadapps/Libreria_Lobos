<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'UAD') }}</title>
    <link rel="preload" as="video" href="{{ asset('videos/fondo.mp4') }}">
    <link rel="preload" as="video" href="{{ asset('images/logo_white.png') }}">
    <link rel="preload" as="video" href="{{ asset('images/logo.png') }}">
    @routes
    @viteReactRefresh
   @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
