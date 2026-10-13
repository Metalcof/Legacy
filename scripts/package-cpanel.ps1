[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$workspaceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).ProviderPath
$runtimeRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot '.sites-runtime'))
$runtimePrefix = $runtimeRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

function Assert-RuntimeChild {
    param([Parameter(Mandatory = $true)][string]$Candidate)
    $absolute = [System.IO.Path]::GetFullPath($Candidate)
    if (-not $absolute.StartsWith($runtimePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "La ruta no está dentro de la carpeta temporal del proyecto: $absolute"
    }
    return $absolute
}

$sourceNames = @('index.html', 'styles.css', 'app.js', 'effects.js', 'project-journey.js', 'config.js', 'assets', 'demos')
foreach ($name in $sourceNames) {
    if (-not (Test-Path -LiteralPath (Join-Path $workspaceRoot $name))) {
        throw "Falta un archivo o carpeta del sitio: $name"
    }
}
if (Test-Path -LiteralPath (Join-Path $workspaceRoot '.htaccess') -PathType Leaf) {
    $sourceNames += '.htaccess'
}

if (Test-Path -LiteralPath $runtimeRoot) {
    $runtimeItem = Get-Item -LiteralPath $runtimeRoot -Force
    if (-not $runtimeItem.PSIsContainer -or ($runtimeItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        throw 'La carpeta .sites-runtime debe ser una carpeta normal dentro de este proyecto.'
    }
} else {
    New-Item -ItemType Directory -Path $runtimeRoot | Out-Null
}

$packageId = [System.Guid]::NewGuid().ToString('N')
$stageRoot = Assert-RuntimeChild (Join-Path $runtimeRoot "cpanel-stage-$packageId")
$temporaryZip = Assert-RuntimeChild (Join-Path $runtimeRoot "cpanel-$packageId.zip")
$outputZip = Assert-RuntimeChild (Join-Path $runtimeRoot 'nexo-studio-cpanel.zip')

try {
    New-Item -ItemType Directory -Path $stageRoot | Out-Null
    foreach ($name in $sourceNames) {
        Copy-Item -LiteralPath (Join-Path $workspaceRoot $name) -Destination $stageRoot -Recurse -Force
    }
    # Solo se publican las fotos WebP optimizadas; los originales se conservan en el proyecto.
    foreach ($name in @(
        'robot-hero.png', 'robot-dark.png', 'cafe-editorial.png', 'creative-conversation.png', 'architecture-editorial.png',
        'headphones-lavanda.png', 'headphones-grafito.png', 'headphones-lima.png',
        'interior-editorial.png', 'coffee-menu.png', 'wellness-editorial.png', 'restaurant-editorial.png', 'professional-editorial.png',
        'case-cafe-flatwhite.png', 'case-cafe-croissant.png', 'case-cafe-iced.png', 'case-cafe-barista.png',
        'case-architecture-patio.png', 'case-architecture-loft.png', 'case-wav-lifestyle.png', 'case-wav-detail.png',
        'case-clinic-consultation.png', 'case-clinic-team.png',
        'case-restaurant-tostadas.png', 'case-restaurant-fish.png', 'case-restaurant-rice.png', 'case-restaurant-cacao.png',
        'case-personal-cosmetics.png', 'case-personal-hotel.png', 'case-personal-workshop.png',
        'auto-cafeteria.png', 'auto-arquitectura.png', 'auto-tienda.png', 'auto-clinica.png', 'auto-restaurante.png', 'auto-personal.png'
    )) {
        $stagedOriginal = Assert-RuntimeChild (Join-Path (Join-Path $stageRoot 'assets') $name)
        if (Test-Path -LiteralPath $stagedOriginal -PathType Leaf) {
            Remove-Item -LiteralPath $stagedOriginal -Force
        }
    }

    # ZIP usa rutas con / para que cPanel pueda extraerlo correctamente en Linux.
    # Los archivos quedan en la raíz, sin una carpeta dist o de preparación.
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $stagePrefix = $stageRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    $archive = [System.IO.Compression.ZipFile]::Open($temporaryZip, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        Get-ChildItem -LiteralPath $stageRoot -Recurse -File -Force | ForEach-Object {
            $absoluteFile = [System.IO.Path]::GetFullPath($_.FullName)
            if (-not $absoluteFile.StartsWith($stagePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "El archivo no está dentro de la preparación: $absoluteFile"
            }
            $entryName = $absoluteFile.Substring($stagePrefix.Length).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive, $absoluteFile, $entryName, [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    } finally {
        $archive.Dispose()
    }
    Move-Item -LiteralPath $temporaryZip -Destination $outputZip -Force
    $package = Get-Item -LiteralPath $outputZip
    Write-Output "Paquete para cPanel: $($package.FullName)"
    Write-Output "Tamaño: $($package.Length) bytes"
} finally {
    # Se elimina solamente la preparación creada por esta ejecución y verificada arriba.
    if (Test-Path -LiteralPath $stageRoot) {
        $verifiedStage = Assert-RuntimeChild ((Resolve-Path -LiteralPath $stageRoot).ProviderPath)
        Remove-Item -LiteralPath $verifiedStage -Recurse -Force
    }
    if (Test-Path -LiteralPath $temporaryZip) {
        $verifiedZip = Assert-RuntimeChild ((Resolve-Path -LiteralPath $temporaryZip).ProviderPath)
        Remove-Item -LiteralPath $verifiedZip -Force
    }
}
