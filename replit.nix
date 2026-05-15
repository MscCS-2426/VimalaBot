{ pkgs }: {
  deps = [
    pkgs.python312Full
    pkgs.nodejs_20
    pkgs.git
    pkgs.libffi
    pkgs.openssl
    pkgs.zlib
    pkgs.glibcLocales
  ];
}
