export enum AclType {
  Nfs4 = 'NFS4',
  Posix1e = 'POSIX1E',
  Rich = 'RICH',
}

export enum AclItemTag {
  UserObject = 'USER_OBJ',
  GroupObject = 'GROUP_OBJ',
  User = 'USER',
  Group = 'GROUP',
  Other = 'OTHER',
  Mask = 'MASK',
}

export enum AclPermission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE',
}

export enum DefaultAclType {
  Nfs4Open = 'NFS4_OPEN',
  Nfs4Restricted = 'NFS4_RESTRICTED',
  Nfs4Home = 'NFS4_HOME',
  Nfs4DomainHome = 'NFS4_DOMAIN_HOME',
  PosixOpen = 'POSIX_OPEN',
  PosixRestricted = 'POSIX_RESTRICTED',
  Open = 'OPEN',
  Restricted = 'RESTRICTED',
  Home = 'HOME',
}
