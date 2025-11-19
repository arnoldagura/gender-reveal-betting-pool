'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Page() {
  const [bets, setBets] = useState([]);
  const [newBet, setNewBet] = useState({ name: '', gender: 'boy', amount: '' });
  const [revealedGender, setRevealedGender] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingBet, setEditingBet] = useState(null);

  useEffect(() => {
    fetchData();
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

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addBet = async (e) => {
    e.preventDefault();
    const amount = parseFloat(newBet.amount);

    if (!newBet.name || !newBet.amount || isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid name and bet amount', 'error');
      return;
    }

    if (isRevealed) {
      showNotification(
        'Betting is closed - gender has been revealed!',
        'error'
      );
      return;
    }

    setIsLoading(true);

    // Simulate async operation (you can replace this with actual API call)
    setTimeout(() => {
      try {
        const bet = {
          id: Date.now(),
          name: newBet.name.trim(),
          gender: newBet.gender,
          amount: amount,
        };

        setBets([...bets, bet]);
        setNewBet({ name: '', gender: 'boy', amount: '' });
        showNotification(
          `Bet placed successfully! PHP ${amount.toFixed(2)} on ${
            newBet.gender
          }`,
          'success'
        );
      } catch (error) {
        showNotification('Failed to place bet. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const removeBet = async (id) => {
    if (isRevealed) {
      showNotification('Cannot remove bets after reveal!', 'error');
      return;
    }

    const bet = bets.find((b) => b.id === id);
    if (window.confirm(`Are you sure you want to remove ${bet?.name}'s bet?`)) {
      setBets(bets.filter((bet) => bet.id !== id));
      showNotification('Bet removed successfully', 'success');
    }
  };

  const startEditBet = (bet) => {
    setEditingBet({ ...bet });
  };

  const cancelEdit = () => {
    setEditingBet(null);
  };

  const saveEdit = () => {
    if (!editingBet.name || !editingBet.amount || editingBet.amount <= 0) {
      showNotification('Please enter a valid name and bet amount', 'error');
      return;
    }

    setBets(
      bets.map((bet) =>
        bet.id === editingBet.id
          ? { ...editingBet, amount: parseFloat(editingBet.amount) }
          : bet
      )
    );
    setEditingBet(null);
    showNotification('Bet updated successfully', 'success');
  };

  const revealGender = async (gender) => {
    try {
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revealedGender: gender,
          isRevealed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reveal gender');
      }

      await fetchData();
    } catch (error) {
      alert('Error revealing gender: ' + error.message);
    }
  };

  const resetGame = async () => {
    if (
      !confirm(
        'Are you sure you want to start a new game? This will delete all bets!'
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset game');
      }

      await fetchData();
    } catch (error) {
      alert('Error resetting game: ' + error.message);
    }
  };

  // Calculate totals and winners
  const totalPot = bets.reduce((sum, bet) => sum + bet.amount, 0);

  const boyBets = bets.filter((bet) => bet.gender === 'boy');
  const girlBets = bets.filter((bet) => bet.gender === 'girl');
  const boyTotal = boyBets.reduce((sum, bet) => sum + bet.amount, 0);
  const girlTotal = girlBets.reduce((sum, bet) => sum + bet.amount, 0);

  const boyWinningRatio = boyTotal > 0 ? totalPot / boyTotal : 0;
  const girlWinningRatio = girlTotal > 0 ? totalPot / girlTotal : 0;

  const winners = isRevealed
    ? bets.filter((bet) => bet.gender === revealedGender)
    : [];
  const winnerCount = winners.length;

  // Calculate individual winnings based on bet amount and win ratio
  const calculateWinnings = (bet) => {
    if (!isRevealed || bet.gender !== revealedGender) return 0;
    const winRatio = bet.gender === 'boy' ? boyWinningRatio : girlWinningRatio;
    return bet.amount * winRatio;
  };

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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            </div>

            <button type='submit' className='btn-primary' disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className='loader'></span>
                  Placing Bet...
                </>
              ) : (
                <>Place Bet 🚀</>
              )}
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
                {editingBet && editingBet.id === bet.id ? (
                  <div className='bet-edit-form'>
                    <input
                      type='text'
                      className='form-input-small'
                      value={editingBet.name}
                      onChange={(e) =>
                        setEditingBet({ ...editingBet, name: e.target.value })
                      }
                      placeholder='Name'
                    />
                    <select
                      className='form-select-small'
                      value={editingBet.gender}
                      onChange={(e) =>
                        setEditingBet({ ...editingBet, gender: e.target.value })
                      }
                    >
                      <option value='boy'>👶 Boy</option>
                      <option value='girl'>👧 Girl</option>
                    </select>
                    <input
                      type='number'
                      className='form-input-small'
                      value={editingBet.amount}
                      onChange={(e) =>
                        setEditingBet({ ...editingBet, amount: e.target.value })
                      }
                      placeholder='Amount'
                      min='1'
                      step='0.01'
                    />
                    <div className='edit-actions'>
                      <button
                        onClick={saveEdit}
                        className='btn-save'
                        title='Save'
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className='btn-cancel'
                        title='Cancel'
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='bet-info'>
                      <div className='bet-name'>{bet.name}</div>
                      <span className={`bet-gender ${bet.gender}`}>
                        {bet.gender === 'boy' ? '👶 Boy' : '👧 Girl'}
                      </span>
                      <div className='bet-amount'>
                        PHP {bet.amount.toFixed(2)}
                      </div>
                      {isRevealed && bet.gender === revealedGender && (
                        <div className='winner-badge'>🎉 Winner!</div>
                      )}
                    </div>
                    {!isRevealed && (
                      <div className='bet-actions'>
                        <button
                          onClick={() => startEditBet(bet)}
                          className='btn-edit'
                          title='Edit bet'
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => removeBet(bet.id)}
                          className='btn-remove'
                          title='Remove bet'
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </>
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
                      Wins: PHP {calculateWinnings(winner).toFixed(2)}
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

      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.message}
        </div>
      )}
    </div>
  );
}
