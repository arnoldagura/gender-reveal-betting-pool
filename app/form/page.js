'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Page() {
  const [bets, setBets] = useState([]);
  const [newBet, setNewBet] = useState({ name: '', gender: 'boy', amount: '' });
  const [revealedGender, setRevealedGender] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [confirmModal, setConfirmModal] = useState(null);
  const [resetting, setResetting] = useState(false);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Confirmation modal helpers
  const showConfirmModal = (title, message, onConfirm, type = 'warning') => {
    setConfirmModal({ title, message, onConfirm, type });
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  const handleConfirm = () => {
    if (confirmModal?.onConfirm) {
      confirmModal.onConfirm();
    }
    closeConfirmModal();
  };

  // Fetch data from API
  const fetchData = async () => {
    try {
      const [betsResponse, gameStateResponse] = await Promise.all([
        fetch('/api/bets'),
        fetch('/api/game-state')
      ]);

      const betsData = await betsResponse.json();
      const gameStateData = await gameStateResponse.json();

      setBets(betsData);
      setRevealedGender(gameStateData.revealed_gender);
      setIsRevealed(gameStateData.is_revealed);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addBet = async (e) => {
    e.preventDefault();

    if (!newBet.name || !newBet.amount) {
      showToast('Please enter a valid name and bet amount', 'error');
      return;
    }

    if (isRevealed) {
      showToast('Betting is closed - gender has been revealed!', 'error');
      return;
    }

    // Check for duplicate name
    const duplicateName = bets.find(
      bet => bet.name.toLowerCase().trim() === newBet.name.toLowerCase().trim()
    );
    if (duplicateName) {
      showToast(`Name "${newBet.name}" already exists! Please use a different name.`, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBet.name,
          gender: newBet.gender,
          amount: parseFloat(newBet.amount)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add bet');
      }

      // Refresh data
      await fetchData();
      setNewBet({ name: '', gender: 'boy', amount: '' });
      showToast('Bet placed successfully!', 'success');
    } catch (error) {
      showToast('Error adding bet: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const removeBet = (id) => {
    if (isRevealed) {
      showToast('Cannot remove bets after reveal!', 'error');
      return;
    }

    const bet = bets.find((b) => b.id === id);
    showConfirmModal(
      'Delete Bet',
      `Are you sure you want to remove ${bet?.name}'s bet of PHP ${bet?.amount?.toFixed(2)}?`,
      async () => {
        try {
          const response = await fetch(`/api/bets?id=${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to remove bet');
          }

          await fetchData();
          showToast('Bet removed successfully!', 'success');
        } catch (error) {
          showToast('Error removing bet: ' + error.message, 'error');
        }
      },
      'danger'
    );
  };

  const startEditBet = (bet) => {
    setEditingBet({ ...bet });
  };

  const cancelEdit = () => {
    setEditingBet(null);
  };

  const updateBet = async (e) => {
    e.preventDefault();

    if (!editingBet.name || !editingBet.amount) {
      showToast('Please enter a valid name and bet amount', 'error');
      return;
    }

    if (isRevealed) {
      showToast('Cannot edit bets after reveal!', 'error');
      return;
    }

    // Check for duplicate name (excluding current bet)
    const duplicateName = bets.find(
      bet => bet.id !== editingBet.id &&
             bet.name.toLowerCase().trim() === editingBet.name.toLowerCase().trim()
    );
    if (duplicateName) {
      showToast(`Name "${editingBet.name}" already exists! Please use a different name.`, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/bets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingBet.id,
          name: editingBet.name,
          gender: editingBet.gender,
          amount: parseFloat(editingBet.amount)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bet');
      }

      await fetchData();
      setEditingBet(null);
      showToast('Bet updated successfully!', 'success');
    } catch (error) {
      showToast('Error updating bet: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const revealGender = (gender) => {
    const genderText = gender === 'boy' ? 'Boy 👶' : 'Girl 👧';
    showConfirmModal(
      'Reveal Gender',
      `Are you sure you want to reveal the gender as ${genderText}? This action cannot be undone and will close betting!`,
      async () => {
        try {
          const response = await fetch('/api/game-state', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              revealedGender: gender,
              isRevealed: true
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to reveal gender');
          }

          await fetchData();
          showToast(`Gender revealed as ${genderText}!`, 'success');
        } catch (error) {
          showToast('Error revealing gender: ' + error.message, 'error');
        }
      },
      'info'
    );
  };

  const resetGame = () => {
    showConfirmModal(
      'Reset Betting Pool',
      'Are you sure you want to reset the entire betting pool? All bets and results will be permanently deleted!',
      async () => {
        setResetting(true);
        try {
          const response = await fetch('/api/reset', {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to reset game');
          }

          await fetchData();
          showToast('Betting pool reset successfully!', 'success');
        } catch (error) {
          showToast('Error resetting game: ' + error.message, 'error');
        } finally {
          setResetting(false);
        }
      },
      'danger'
    );
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

            <button type='submit' className='btn-primary' disabled={submitting}>
              {submitting ? 'Placing Bet...' : 'Place Bet 🚀'}
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
                  <div className='bet-actions'>
                    <button
                      onClick={() => startEditBet(bet)}
                      className='btn-edit'
                      title='Edit bet'
                    >
                      ✏️
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
        <button onClick={resetGame} className='btn-reset' disabled={resetting}>
          {resetting ? (
            <>
              <span className='loader' style={{borderTopColor: 'white'}}></span>
              Resetting...
            </>
          ) : (
            '🔄 Reset Betting Pool'
          )}
        </button>
      </div>

      {/* Edit Modal */}
      {editingBet && (
        <div className='modal-overlay' onClick={cancelEdit}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2 className='modal-title'>Edit Bet</h2>
              <button onClick={cancelEdit} className='modal-close'>
                ✕
              </button>
            </div>

            <form onSubmit={updateBet} className='modal-form'>
              <div className='form-group'>
                <label className='form-label'>Name</label>
                <input
                  type='text'
                  className='form-input'
                  placeholder='Enter your name'
                  value={editingBet.name}
                  onChange={(e) =>
                    setEditingBet({ ...editingBet, name: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className='form-group'>
                <label className='form-label'>Prediction</label>
                <select
                  className='form-select'
                  value={editingBet.gender}
                  onChange={(e) =>
                    setEditingBet({ ...editingBet, gender: e.target.value })
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
                  value={editingBet.amount}
                  onChange={(e) =>
                    setEditingBet({ ...editingBet, amount: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={cancelEdit}
                  className='btn-cancel'
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type='submit' className='btn-primary' disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Bet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <span className='toast-icon'>
            {toast.type === 'success' ? '✅' : '❌'}
          </span>
          <span className='toast-message'>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className='modal-overlay' onClick={closeConfirmModal}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h3 className='modal-title'>{confirmModal.title}</h3>
              <button className='modal-close' onClick={closeConfirmModal}>✕</button>
            </div>
            <div className='modal-body'>
              <div className='modal-icon'>
                {confirmModal.type === 'danger' ? '⚠️' : confirmModal.type === 'info' ? '❓' : '⚠️'}
              </div>
              <p className='modal-message'>{confirmModal.message}</p>
            </div>
            <div className='modal-footer'>
              <button className='btn-modal-cancel' onClick={closeConfirmModal}>
                Cancel
              </button>
              <button className={`btn-modal-confirm ${confirmModal.type}`} onClick={handleConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className='modal-overlay'>
          <div className='loading-spinner'>
            <div className='spinner'></div>
            <p>Loading betting pool...</p>
          </div>
        </div>
      )}
    </div>
  );
}