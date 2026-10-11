import { Link } from '../router'

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">404</p>
      <h1>This aisle is empty</h1>
      <p>The link may be old, or the shelf was moved. The good stuff is one click away.</p>
      <Link to="/" className="btn btn-primary btn-lg">
        Back to the storefront
      </Link>
    </section>
  )
}
