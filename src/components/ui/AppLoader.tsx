type AppLoaderProps = {
  label?: string
}

export default function AppLoader({ label = "Loading" }: AppLoaderProps) {
  return (
    <div className="app-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="app-loader__content">
        <div className="app-loader__spinner" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="app-loader__segment" />
          ))}
        </div>
        <div className="app-loader__label" aria-hidden="true">
          <span>Loading</span>
          <span className="app-loader__dots">
            <i>.</i><i>.</i><i>.</i>
          </span>
        </div>
      </div>
    </div>
  )
}
