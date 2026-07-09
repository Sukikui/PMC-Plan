export default function PositionPanelAnimations() {
  return (
    <style jsx>{`
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }
      @keyframes blueGlow {
        0% { 
          border-color: rgb(59 130 246 / 0.8);
          box-shadow: 0 0 0 0 rgb(59 130 246 / 0.4);
        }
        50% { 
          border-color: rgb(59 130 246 / 0.4);
          box-shadow: 0 0 0 4px rgb(59 130 246 / 0.1);
        }
        100% { 
          border-color: rgb(229 231 235 / 0.5);
          box-shadow: 0 0 0 0 rgb(59 130 246 / 0);
        }
      }
      @keyframes blueGlowDark {
        0% { 
          border-color: rgb(59 130 246 / 0.8);
          box-shadow: 0 0 0 0 rgb(59 130 246 / 0.4);
        }
        50% { 
          border-color: rgb(59 130 246 / 0.4);
          box-shadow: 0 0 0 4px rgb(59 130 246 / 0.1);
        }
        100% { 
          border-color: rgb(75 85 99 / 0.5);
          box-shadow: 0 0 0 0 rgb(59 130 246 / 0);
        }
      }
    `}</style>
  );
}

