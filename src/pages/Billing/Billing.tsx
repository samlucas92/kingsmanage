import { useEffect, useState, type FormEvent } from "react";

import { billingApi } from "../../services/billingApi";
import type {
	BillingInvoice,
	OrganizationSubscription,
} from "../../types/billing";
import { calculateMonthlyPrice } from "./billingCalculator";
import OrganizationAdminNav from "../../components/organization/OrganizationAdminNav";

export default function Billing() {
	const [subscription, setSubscription] =
		useState<OrganizationSubscription | null>(null);
	const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
	const [clubAllowance, setClubAllowance] = useState(1);
	const [billingEmail, setBillingEmail] = useState("");
	const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		let active = true;
		Promise.all([billingApi.getSubscription(), billingApi.getInvoices()])
			.then(([loadedSubscription, loadedInvoices]) => {
				if (!active) return;
				setSubscription(loadedSubscription);
				setInvoices(loadedInvoices);
				setClubAllowance(loadedSubscription.clubAllowance);
				setBillingEmail(loadedSubscription.billingEmail);
				setCancelAtPeriodEnd(loadedSubscription.cancelAtPeriodEnd);
			})
			.catch((reason) => {
				if (active) {
					setMessage(
						reason instanceof Error
							? reason.message
							: "Could not load billing."
					);
				}
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	async function save(event: FormEvent) {
		event.preventDefault();
		setSaving(true);
		setMessage("");
		try {
			const updated = await billingApi.updateSubscription({
				clubAllowance,
				billingEmail,
				cancelAtPeriodEnd,
			});
			setSubscription(updated);
			setMessage("Subscription settings saved.");
		} catch (reason) {
			setMessage(
				reason instanceof Error
					? reason.message
					: "Could not update subscription."
			);
		} finally {
			setSaving(false);
		}
	}

	if (loading) return <p className="text-sm text-slate-500">Loading billing...</p>;
	if (!subscription) {
		return <div className="surface-card p-5 text-red-700">{message}</div>;
	}

	const estimatedPrice = calculateMonthlyPrice(
		clubAllowance,
		subscription.baseMonthlyPrice,
		subscription.additionalClubMonthlyPrice
	);

	return (
		<div className="mx-auto max-w-5xl space-y-5">
			<OrganizationAdminNav />
			<header className="surface-card p-6">
				<p className="text-xs font-black uppercase tracking-[.14em] text-yepset-600">
					Organization subscription
				</p>
				<div className="mt-2 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-3xl font-black">Billing</h1>
						<p className="mt-1 text-sm text-slate-500">
							Core includes one club, with a simple monthly increment for each
							additional club.
						</p>
					</div>
					<StatusBadge status={subscription.status} />
				</div>
			</header>

			{message && (
				<div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">
					{message}
				</div>
			)}

			<div className="grid gap-5 lg:grid-cols-2">
				<form onSubmit={save} className="surface-card p-5">
					<h2 className="text-xl font-black">Core plan</h2>
					<div className="mt-5 rounded-2xl bg-yepset-50 p-5">
						<p className="text-sm font-bold text-yepset-800">
							Estimated monthly price
						</p>
						<p className="mt-1 text-4xl font-black text-yepset-950">
							{formatMoney(estimatedPrice, subscription.currency)}
						</p>
						<p className="mt-2 text-xs text-yepset-700">
							{formatMoney(subscription.baseMonthlyPrice, subscription.currency)}{" "}
							for the first club +{" "}
							{formatMoney(
								subscription.additionalClubMonthlyPrice,
								subscription.currency
							)}{" "}
							per additional club.
						</p>
					</div>
					<label className="mt-5 block text-sm font-semibold">
						Club allowance
						<input
							type="number"
							min={1}
							max={100}
							value={clubAllowance}
							onChange={(event) =>
								setClubAllowance(Number(event.target.value))
							}
							className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
						/>
					</label>
					<label className="mt-4 block text-sm font-semibold">
						Billing contact
						<input
							type="email"
							value={billingEmail}
							onChange={(event) => setBillingEmail(event.target.value)}
							className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5"
							placeholder="accounts@club.example"
						/>
					</label>
					<label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
						<input
							type="checkbox"
							checked={cancelAtPeriodEnd}
							onChange={(event) => setCancelAtPeriodEnd(event.target.checked)}
							className="mt-1"
						/>
						<span>
							<strong>Cancel at period end</strong>
							<span className="mt-1 block text-slate-500">
								Existing club data remains readable; new paid capacity is
								disabled after cancellation.
							</span>
						</span>
					</label>
					<button disabled={saving} className="btn-primary mt-5 disabled:opacity-50">
						{saving ? "Saving..." : "Save subscription"}
					</button>
				</form>

				<section className="surface-card p-5">
					<h2 className="text-xl font-black">What is included</h2>
					<ul className="mt-4 space-y-3 text-sm text-slate-700">
						<li>✓ One club in the base subscription</li>
						<li>✓ Unlimited teams within each subscribed club</li>
						<li>✓ Unlimited administrators, coaches and players</li>
						<li>✓ Existing organization storage quota and usage reporting</li>
						<li>✓ A 14-day grace period after payment problems</li>
					</ul>
					<PeriodDetails subscription={subscription} />
				</section>
			</div>

			<section className="surface-card overflow-hidden">
				<div className="border-b border-slate-200 p-5">
					<h2 className="text-xl font-black">Invoices and payment history</h2>
				</div>
				{invoices.length === 0 ? (
					<p className="p-5 text-sm text-slate-500">No invoices yet.</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="bg-slate-50 text-xs uppercase text-slate-500">
								<tr><th className="p-3">Invoice</th><th className="p-3">Issued</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr>
							</thead>
							<tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-t border-slate-100"><td className="p-3 font-bold">{invoice.number}</td><td className="p-3">{formatDate(invoice.issuedAt)}</td><td className="p-3">{formatMoney(invoice.amount, invoice.currency)}</td><td className="p-3">{invoice.status}</td></tr>)}</tbody>
						</table>
					</div>
				)}
			</section>
		</div>
	);
}

function StatusBadge({ status }: { status: OrganizationSubscription["status"] }) {
	const attention = status === "PastDue" || status === "Cancelled";
	return <span className={`rounded-full px-3 py-1.5 text-sm font-black ${attention ? "bg-red-100 text-red-700" : status === "GracePeriod" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{status.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>;
}

function PeriodDetails({ subscription }: { subscription: OrganizationSubscription }) {
	const date = subscription.status === "Trialing" ? subscription.trialEndsAt : subscription.gracePeriodEndsAt ?? subscription.currentPeriodEndsAt;
	if (!date) return null;
	return <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Current status date: <strong>{formatDate(date)}</strong></p>;
}

function formatMoney(value: number, currency: string) {
	return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
}

function formatDate(value: string) {
	return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
