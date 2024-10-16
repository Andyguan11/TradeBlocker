import AuthPage from '../components/AuthPage'

export default function Home() {
  return (
    <div>
      <h1>Welcome to TradeBlocker</h1>
      <AuthPage mode="login" />
    </div>
  )
}
