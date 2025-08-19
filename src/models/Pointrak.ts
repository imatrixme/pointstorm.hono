export interface Pointrak {
  id: number
  sn: string
  points: number
  owner: number
  detail: string
  channel: PointrakChannel
  createdAt: number
  updatedAt: number
}

export type PointrakChannel = 
  | 'just_reward'
  | 'outer_banner_show' 
  | 'outer_banner_click' 
  | 'outer_screen_show' 
  | 'outer_screen_click' 
  | 'outer_screen_click_video' 
  | 'outer_rewardvideo_show' 
  | 'outer_rewardvideo_click'
  | 'inner_txt_show' 
  | 'inner_txt_click' 
  | 'inner_img_show' 
  | 'inner_img_click' 
  | 'inner_video_show' 
  | 'inner_video_click'
  | 'game_play' 
  | 'game_defeat' 
  | 'game_victory'
  | 'shopping'
  | 'promotion'
  | 'envelop'

export interface CreatePointrakInput {
  points: number
  owner: number
  detail?: string
  channel: PointrakChannel
}

export interface PointrakWithOwner extends Pointrak {
  ownerInfo: {
    userId: number
    name: string
    digit: string
    avatar: string
  }
}