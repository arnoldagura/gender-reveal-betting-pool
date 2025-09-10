export interface Bet {
  id: number
  name: string
  gender: 'boy' | 'girl'
  amount: number
}

export interface NewBetForm {
  name: string
  gender: 'boy' | 'girl'
  amount: string
}
