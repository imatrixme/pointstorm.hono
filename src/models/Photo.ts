export interface Photo {
  id: number
  url: string
  story?: number
  owner: number
  createdAt: number
  updatedAt: number
}

export interface CreatePhotoInput {
  url: string
  story?: number
  owner: number
}

export interface PhotoWithOwner extends Photo {
  ownerInfo: {
    userId: number
    name: string
    avatar: string
    digit: string
  }
}