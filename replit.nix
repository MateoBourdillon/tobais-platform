{pkgs}: {
  deps = [
    pkgs.lsof
    pkgs.dnsutils
    pkgs.postgresql
    pkgs.jq
  ];
}
