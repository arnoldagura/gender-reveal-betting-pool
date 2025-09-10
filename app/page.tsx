"use client"
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Bet, NewBetForm } from './types'

export default function Home() {
  const [bets, setBets] = useState<Bet[]>([])
  const [newBet, setNewBet] = useState<NewBetForm>({ name: '', gender: 'boy', amount: '' })
  const [revealedGender, setRevealedGender] = useState<'boy' | 'girl' | null>(null)
  const [isRevealed, setIsRevealed] = useState<boolean>(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedBets = localStorage.getItem('genderRevealBets')
    const savedReveal = localStorage.getItem('revealedGender')
    const savedIsRevealed = localStorage.getItem('isRevealed')
    
    if (savedBets) {
      setBets(JSON.parse(savedBets) as Bet[])
    }
    if (savedReveal && (savedReveal === 'boy' || savedReveal === 'girl')) {
      setRevealedGender(savedReveal as 'boy' | 'girl')
    }
    if (savedIsRevealed) {
      setIsRevealed(JSON.parse(savedIsRevealed) as boolean)
    }
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('genderRevealBets', JSON.stringify(bets))
  }, [bets])

  useEffect(() => {
    if (revealedGender) {
      localStorage.setItem('revealedGender', revealedGender)
    }
  }, [revealedGender])

  useEffect(() => {
    localStorage.setItem('isRevealed', JSON.stringify(isRevealed))
  }, [isRevealed])

  const addBet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const amount = parseFloat(newBet.amount)
    
    if (!newBet.name || !newBet.amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid name and bet amount')
      return
    }

    if (isRevealed) {
      alert('Betting is closed - gender has been revealed!')
      return
    }

    const bet: Bet = {
      id: Date.now(),
      name: newBet.name.trim(),
      gender: newBet.gender,
      amount: amount
    }

    setBets([...bets, bet])
    setNewBet({ name: '', gender: 'boy', amount: '' })
  }

  const removeBet = (id: number) => {
    if (isRevealed) {
      alert('Cannot remove bets after reveal!')
      return
    }
    setBets(bets.filter(bet => bet.id !== id))
  }

  const revealGender = (gender: 'boy' | 'girl') => {
    setRevealedGender(gender)
    setIsRevealed(true)
  }

  const resetGame = () => {
    setBets([])
    setRevealedGender(null)
    setIsRevealed(false)
    localStorage.removeItem('genderRevealBets')
    localStorage.removeItem('revealedGender')
    localStorage.removeItem('isRevealed')
  }

  // Calculate totals and winners
  const totalPot = bets.reduce((sum, bet) => sum + bet.amount, 0)
  const winners = isRevealed ? bets.filter(bet => bet.gender === revealedGender) : []
  const winnerCount = winners.length
  const winningsPerWinner = winnerCount > 0 ? totalPot / winnerCount : 0

  const boyBets = bets.filter(bet => bet.gender === 'boy')
  const girlBets = bets.filter(bet => bet.gender === 'girl')
  const boyTotal = boyBets.reduce((sum, bet) => sum + bet.amount, 0)
  const girlTotal = girlBets.reduce((sum, bet) => sum + bet.amount, 0)
    
  let boyWinningRatio = totalPot / boyTotal;
  let girlWinningRatio = totalPot / girlTotal;

  return (
    <div className="container">
      <Head>
        <title>Gender Reveal Betting Pool</title> 
        <meta name="description" content="Place your bets on the baby's gender!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>🍼 Gender Reveal Betting Pool 🍼</h1>
         <div className="odds-grid">
        {/* Boy Odds Card */}
        <div className="odds-card boy-card">
          <div className="odds-header">
            <span className="emoji">👶</span>
            <h3>Team Boy</h3>
          </div>
          
          <div className="odds-stats">
            <div className="main-ratio">
              <span className="ratio-label">Win Ratio:</span>
              <span className="ratio-value">
                {boyWinningRatio > 0 ? `${boyWinningRatio.toFixed(2)}` : 'No bets'}
              </span>
            </div>
            
            
            <div className="bet-info">
              <div className="bet-count">{boyBets.length} Bet/s</div>
              <div className="bet-amount">PHP {boyTotal.toFixed(2)}</div>
            </div>
            
            <div className="payout-example">
              <small>
                Bet PHP 10 → Win PHP {boyWinningRatio > 0 ? (10 * boyWinningRatio).toFixed(2) : '0.00'}
              </small>
            </div>
          </div>
        </div>

        {/* Girl Odds Card */}
        <div className="odds-card girl-card">
          <div className="odds-header">
            <span className="emoji">👧</span>
            <h3>Team Girl</h3>
          </div>
          
          <div className="odds-stats">
            <div className="main-ratio">
              <span className="ratio-label">Win Ratio:</span>
              <span className="ratio-value">
                {girlWinningRatio > 0 ? `${girlWinningRatio.toFixed(2)}` : 'No bets'}
              </span>
            </div>
            
            
            <div className="bet-info">
              <div className="bet-count">{girlBets.length} Bet/s</div>
              <div className="bet-amount">PHP {girlTotal.toFixed(2)}</div>
            </div>
            
            <div className="payout-example">
              <small>
                Bet PHP 10 → Win PHP {girlWinningRatio > 0 ? (10 * girlWinningRatio).toFixed(2) : '0.00'}
              </small>
            </div>
          </div>
        </div>
      </div>
         {boyWinningRatio} hello {girlWinningRatio}
        {/* Betting Form */}
        {!isRevealed && (
          <div className="bet-form">
            <h2>Place Your Bet</h2>
            <form onSubmit={addBet}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Your name"
                  value={newBet.name}
                  onChange={(e) => setNewBet({...newBet, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <select
                  value={newBet.gender}
                  onChange={(e) => setNewBet({...newBet, gender: e.target.value as 'boy' | 'girl'})}
                >
                  <option value="boy">👶 Boy</option>
                  <option value="girl">👧 Girl</option>
                </select>
              </div>
              
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Bet amount (PHP)"
                  min="1"
                  step="0.01"
                  value={newBet.amount}
                  onChange={(e) => setNewBet({...newBet, amount: e.target.value})}
                  required
                />
              </div>
              
              <button type="submit" className="btn-primary">Place Bet</button>
            </form>
          </div>
        )}

        {/* Current Bets Summary */}
        <div className="summary">
          <h2>Current Pool Status</h2>
          <div className="stats">
            <div className="stat-card">
              <h3>Total Pot</h3>
              <p className="amount">PHP {totalPot.toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Boy Bets</h3>
              <p>{boyBets.length} bets (PHP {boyTotal.toFixed(2)})</p>
            </div>
            <div className="stat-card">
              <h3>Girl Bets</h3>
              <p>{girlBets.length} bets (PHP {girlTotal.toFixed(2)})</p>
            </div>
          </div>
        </div>

        {/* All Bets List */}
        {bets.length > 0 && (
          <div className="bets-list">
            <h2>All Bets</h2>
            <div className="bets-grid">
              {bets.map((bet: Bet) => (
                <div key={bet.id} className={`bet-card ${isRevealed && bet.gender === revealedGender ? 'winner' : ''}`}>
                  <div className="bet-info">
                    <strong>{bet.name}</strong>
                    <span className={`gender ${bet.gender}`}>
                      {bet.gender === 'boy' ? '👶 Boy' : '👧 Girl'}
                    </span>
                    <span className="amount">${bet.amount.toFixed(2)}</span>
                    {isRevealed && bet.gender === revealedGender && (
                      <span className="winner-badge">🎉 WINNER!</span>
                    )}
                  </div>
                  {!isRevealed && (
                    <button 
                      onClick={() => removeBet(bet.id)}
                      className="btn-remove"
                      title="Remove bet"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gender Reveal Section */}
        {bets.length > 0 && !isRevealed && (
          <div className="reveal-section">
            <h2>🎉 Ready to Reveal? 🎉</h2>
            <div className="reveal-buttons">
              <button 
                onClick={() => revealGender('boy')} 
                className="btn-reveal boy"
              >
                It's a Boy! 👶
              </button>
              <button 
                onClick={() => revealGender('girl')} 
                className="btn-reveal girl"
              >
                It's a Girl! 👧
              </button>
            </div>
          </div>
        )}

        {/* Winners Display */}
        {isRevealed && (
          <div className="winners-section">
            <h2>🎊 The Results Are In! 🎊</h2>
            <div className="reveal-result">
              <h3>It's a {revealedGender === 'boy' ? 'Boy! 👶' : 'Girl! 👧'}</h3>
            </div>
            
            {winners.length > 0 ? (
              <div className="winners">
                <h3>🏆 Winners ({winners.length}):</h3>
                <div className="winner-list">
                  {winners.map((winner: Bet) => (
                    <div key={winner.id} className="winner-card">
                      <strong>{winner.name}</strong>
                      <div>
                        Bet: ${winner.amount.toFixed(2)} → 
                        <span className="winnings">Wins: ${winningsPerWinner.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-winners">
                <h3>😅 No Winners!</h3>
                <p>Nobody bet on {revealedGender === 'boy' ? 'boy' : 'girl'}!</p>
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        <div className="actions">
          <button onClick={resetGame} className="btn-reset">
            🔄 Start New Game
          </button>
        </div>
      </main>
    </div>
  )
}