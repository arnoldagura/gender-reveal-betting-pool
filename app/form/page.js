'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Page() {
  const [bets, setBets] = useState([]);
  const [newBet, setNewBet] = useState({ name: '', gender: 'boy', amount: '' });
  const [revealedGender, setRevealedGender] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedBets = localStorage.getItem('genderRevealBets');
    const savedReveal = localStorage.getItem('revealedGender');
    const savedIsRevealed = localStorage.getItem('isRevealed');

    if (savedBets) {
      setBets(JSON.parse(savedBets));
    }
    if (savedReveal && (savedReveal === 'boy' || savedReveal === 'girl')) {
      setRevealedGender(savedReveal);
    }
    if (savedIsRevealed) {
      setIsRevealed(JSON.parse(savedIsRevealed));
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('genderRevealBets', JSON.stringify(bets));
  }, [bets]);

  useEffect(() => {
    if (revealedGender) {
      localStorage.setItem('revealedGender', revealedGender);
    }
  }, [revealedGender]);

  useEffect(() => {
    localStorage.setItem('isRevealed', JSON.stringify(isRevealed));
  }, [isRevealed]);

  const addBet = (e) => {
    e.preventDefault();
    const amount = parseFloat(newBet.amount);

    if (!newBet.name || !newBet.amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid name and bet amount');
      return;
    }

    if (isRevealed) {
      alert('Betting is closed - gender has been revealed!');
      return;
    }

    const bet = {
      id: Date.now(),
      name: newBet.name.trim(),
      gender: newBet.gender,
      amount: amount,
    };

    setBets([...bets, bet]);
    setNewBet({ name: '', gender: 'boy', amount: '' });
  };

  const removeBet = (id) => {
    if (isRevealed) {
      alert('Cannot remove bets after reveal!');
      return;
    }
    setBets(bets.filter((bet) => bet.id !== id));
  };

  const revealGender = (gender) => {
    setRevealedGender(gender);
    setIsRevealed(true);
  };

  const resetGame = () => {
    setBets([]);
    setRevealedGender(null);
    setIsRevealed(false);
    localStorage.removeItem('genderRevealBets');
    localStorage.removeItem('revealedGender');
    localStorage.removeItem('isRevealed');
  };

  // Calculate totals and winners
  const totalPot = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const winners = isRevealed
    ? bets.filter((bet) => bet.gender === revealedGender)
    : [];
  const winnerCount = winners.length;
  const winningsPerWinner = winnerCount > 0 ? totalPot / winnerCount : 0;

  const boyBets = bets.filter((bet) => bet.gender === 'boy');
  const girlBets = bets.filter((bet) => bet.gender === 'girl');
  const boyTotal = boyBets.reduce((sum, bet) => sum + bet.amount, 0);
  const girlTotal = girlBets.reduce((sum, bet) => sum + bet.amount, 0);

  const boyWinningRatio = boyTotal > 0 ? totalPot / boyTotal : 0;
  const girlWinningRatio = girlTotal > 0 ? totalPot / girlTotal : 0;

  return (
    <div className='container'>
      <Head>
        <title>Gender Reveal Betting Pool</title>
        <meta
          name='description'
          content="Place your bets on the baby's gender!"
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      {/* Header */}
      <div className='header'>
        <h1 className='main-title'>Gender Reveal Betting Pool</h1>
        <p className='subtitle'>Place your bets and win big! 🎉</p>
      </div>

      {/* Odds Display */}
      {bets.length > 0 && (
        <div className='odds-container'>
          {/* Boy Odds Card */}
          <div className='odds-card boy'>
            <div className='odds-header'>
              <span className='odds-emoji'>👶</span>
              <h3 className='odds-title'>Team Boy</h3>
            </div>

            <div className='win-ratio'>
              <span className='ratio-label'>Win Ratio</span>
              <span className='ratio-value'>
                {boyWinningRatio > 0 ? `${boyWinningRatio.toFixed(2)}x` : '--'}
              </span>
            </div>

            <div className='bet-stats'>
              <span className='bet-count'>
                {boyBets.length} bet{boyBets.length !== 1 ? 's' : ''}
              </span>
              <span className='bet-amount'>PHP {boyTotal.toFixed(2)}</span>
            </div>

            <div className='payout-preview'>
              Bet PHP 10 → Win PHP{' '}
              {boyWinningRatio > 0 ? (10 * boyWinningRatio).toFixed(2) : '0.00'}
            </div>
          </div>

          {/* Girl Odds Card */}
          <div className='odds-card girl'>
            <div className='odds-header'>
              <span className='odds-emoji'>👧</span>
              <h3 className='odds-title'>Team Girl</h3>
            </div>

            <div className='win-ratio'>
              <span className='ratio-label'>Win Ratio</span>
              <span className='ratio-value'>
                {girlWinningRatio > 0
                  ? `${girlWinningRatio.toFixed(2)}x`
                  : '--'}
              </span>
            </div>

            <div className='bet-stats'>
              <span className='bet-count'>
                {girlBets.length} bet{girlBets.length !== 1 ? 's' : ''}
              </span>
              <span className='bet-amount'>PHP {girlTotal.toFixed(2)}</span>
            </div>

            <div className='payout-preview'>
              Bet PHP 10 → Win PHP{' '}
              {girlWinningRatio > 0
                ? (10 * girlWinningRatio).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>
      )}

      {/* Betting Form */}
      {!isRevealed && (
        <div className='card'>
          <div className='card-header'>
            <span className='card-icon'>💰</span>
            <h2 className='card-title'>Place Your Bet</h2>
          </div>

          <form onSubmit={addBet} className='betting-form'>
            <div className='form-row'>
              <div className='form-group'>
                <label className='form-label'>Your Name</label>
                <input
                  type='text'
                  className='form-input'
                  placeholder='Enter your name'
                  value={newBet.name}
                  onChange={(e) =>
                    setNewBet({ ...newBet, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className='form-group'>
                <label className='form-label'>Prediction</label>
                <select
                  className='form-select'
                  value={newBet.gender}
                  onChange={(e) =>
                    setNewBet({ ...newBet, gender: e.target.value })
                  }
                >
                  <option value='boy'>👶 Boy</option>
                  <option value='girl'>👧 Girl</option>
                </select>
              </div>

              <div className='form-group'>
                <label className='form-label'>Bet Amount</label>
                <input
                  type='number'
                  className='form-input'
                  placeholder='PHP'
                  min='1'
                  step='0.01'
                  value={newBet.amount}
                  onChange={(e) =>
                    setNewBet({ ...newBet, amount: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <button type='submit' className='btn-primary'>
              Place Bet 🚀
            </button>
          </form>
        </div>
      )}

      {/* Pool Status */}
      {bets.length > 0 && (
        <div className='pool-status'>
          <div className='status-card'>
            <div className='status-label'>Total Pool</div>
            <div className='status-value'>PHP {totalPot.toFixed(2)}</div>
          </div>
          <div className='status-card'>
            <div className='status-label'>Boy Bets</div>
            <div className='status-value'>{boyBets.length}</div>
          </div>
          <div className='status-card'>
            <div className='status-label'>Girl Bets</div>
            <div className='status-value'>{girlBets.length}</div>
          </div>
          <div className='status-card'>
            <div className='status-label'>Total Bets</div>
            <div className='status-value'>{bets.length}</div>
          </div>
        </div>
      )}

      {/* All Bets List */}
      {bets.length > 0 && (
        <div className='card'>
          <div className='card-header'>
            <span className='card-icon'>📋</span>
            <h2 className='card-title'>All Bets ({bets.length})</h2>
          </div>

          <div className='bets-grid'>
            {bets.map((bet) => (
              <div
                key={bet.id}
                className={`bet-card ${
                  isRevealed && bet.gender === revealedGender ? 'winner' : ''
                }`}
              >
                <div className='bet-info'>
                  <div className='bet-name'>{bet.name}</div>
                  <span className={`bet-gender ${bet.gender}`}>
                    {bet.gender === 'boy' ? '👶 Boy' : '👧 Girl'}
                  </span>
                  <div className='bet-amount'>PHP {bet.amount.toFixed(2)}</div>
                  {isRevealed && bet.gender === revealedGender && (
                    <div className='winner-badge'>🎉 Winner!</div>
                  )}
                </div>
                {!isRevealed && (
                  <button
                    onClick={() => removeBet(bet.id)}
                    className='btn-remove'
                    title='Remove bet'
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gender Reveal Section */}
      {bets.length > 0 && !isRevealed && (
        <div className='reveal-section'>
          <h2 className='reveal-title'>🎉 Ready to Reveal? 🎉</h2>
          <div className='reveal-buttons'>
            <button
              onClick={() => revealGender('boy')}
              className='btn-reveal boy'
            >
              It's a Boy! 👶
            </button>
            <button
              onClick={() => revealGender('girl')}
              className='btn-reveal girl'
            >
              It's a Girl! 👧
            </button>
          </div>
        </div>
      )}

      {/* Winners Display */}
      {isRevealed && (
        <div className='winners-section'>
          <h2 className='card-title'>🎊 The Results Are In! 🎊</h2>
          <div className='result-announcement'>
            It's a {revealedGender === 'boy' ? 'Boy! 👶' : 'Girl! 👧'}
          </div>

          {winners.length > 0 ? (
            <div>
              <h3 className='card-title'>🏆 Winners ({winners.length}):</h3>
              <div className='winners-grid'>
                {winners.map((winner) => (
                  <div key={winner.id} className='winner-card'>
                    <div className='winner-name'>{winner.name}</div>
                    <div>Bet: PHP {winner.amount.toFixed(2)}</div>
                    <div className='winner-payout'>
                      Wins: PHP {winningsPerWinner.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='no-winners'>
              <h3>😅 No Winners!</h3>
              <p>
                Nobody bet on {revealedGender === 'boy' ? 'boy' : 'girl'}! The
                house wins this time! 🏠
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      <div className='actions'>
        <button onClick={resetGame} className='btn-reset'>
          🔄 Start New Game
        </button>
      </div>
    </div>
  );
}
