import { useEffect, useState, type FormEvent } from "react";

import { billingApi } from "../../services/billingApi";
import type { Organization } from "../../types/organization";
import type {
	BillingInvoice,
	OrganizationSubscription,
	SubscriptionStatus,
} from "../../types/billing";

const statuses: SubscriptionStatus[] = [
	"Trialing",
	"Active",
	"GracePeriod",
	"PastDue",
	"Cancelled",
];

export function PlatformBillingModal({
	organization,
	onClose,
}: {
	organization: Organization;
	onClose: () => void;
}) {
	const [subscription, setSubscription] =
		useState<OrganizationSubscription | null>(null);
	const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
	const [status, setStatus] = useState<SubscriptionStatus>("Trialing");
	const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState("");
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [invoiceAmount, setInvoiceAmount] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let active = true;
		Promise.all([
			billingApi.getPlatformSubscription(organization.id),
			billingApi.getPlatformInvoices(organization.id),
		])
			.then(([loadedSubscription, loadedInvoices]) => {
				if (!active) return;
				setSubscription(loadedSubscription);
				setInvoices(loadedInvoices);
				setStatus(loadedSubscription.status);
				setGracePeriodEndsAt(
					toDateInput(loadedSubscription.gracePeriodEndsAt)
				);
			})
			.catch((reason) => {
				if (active) {
					setError(
						reason instanceof Error
							? reason.message
							: "Could not load billing."
					);
				}
			});
		return () => {
			active = false;
		};
	}, [organization.id]);

	async function saveStatus(event: FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			const updated = await billingApi.setPlatformStatus(organization.id, {
				status,
				gracePeriodEndsAt: gracePeriodEndsAt
					? new Date(`${gracePeriodEndsAt}T23:59:59`).toISOString()
					: null,
			});
			setSubscription(updated);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : "Could not save status.");
		} finally {
			setSaving(false);
		}
	}

	async function addInvoice(event: FormEvent) {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			const invoice = await billingApi.addPlatformInvoice(organization.id, {
				number: invoiceNumber,
				amount: Number(invoiceAmount),
				currency: subscription?.currency ?? "GBP",
				status: "Open",
			});
			setInvoices((current) => [invoice, ...current]);
			setInvoiceNumber("");
			setInvoiceAmount("");
		} catch (reason) {
			setError(
				reason instanceof Error ? reason.message : "Could not add invoice."
			);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-yepset-950/60 p-4 backdrop-blur-sm">
			<div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h2 className="text-xl font-black">Subscription support</h2>
						<p className="text-sm text-slate-500">{organization.name}</p>
					</div>
					<button type="button" onClick={onClose} aria-label="Close">✕</button>
				</div>
				{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
				{subscription ? (
					<>
						<div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
							<div><span className="text-slate-500">Club allowance</span><strong className="block text-lg">{subscription.clubAllowance}</strong></div>
							<div><span className="text-slate-500">Monthly value</span><strong className="block text-lg">{formatMoney(subscription.monthlyPrice, subscription.currency)}</strong></div>
						</div>
						<form onSubmit={saveStatus} className="mt-5 grid gap-3 sm:grid-cols-2">
							<label className="text-sm font-semibold">Status<select value={status} onChange={(event) => setStatus(event.target.value as SubscriptionStatus)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
							<label className="text-sm font-semibold">Grace period ends<input type="date" value={gracePeriodEndsAt} onChange={(event) => setGracePeriodEndsAt(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
							<button disabled={saving} className="btn-primary sm:col-span-2">Update status</button>
						</form>
						<form onSubmit={addInvoice} className="mt-6 border-t border-slate-200 pt-5">
							<h3 className="font-black">Record invoice</h3>
							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<label className="text-sm font-semibold">Invoice number<input required value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
								<label className="text-sm font-semibold">Amount<input required min={0} step="0.01" type="number" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" /></label>
							</div>
							<button disabled={saving} className="btn-secondary mt-3">Add invoice</button>
						</form>
						<div className="mt-5 space-y-2">{invoices.map((invoice) => <div key={invoice.id} className="flex justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"><span className="font-bold">{invoice.number}</span><span>{formatMoney(invoice.amount, invoice.currency)} · {invoice.status}</span></div>)}{invoices.length === 0 && <p className="text-sm text-slate-500">No invoices recorded.</p>}</div>
					</>
				) : (
					<p className="mt-5 text-sm text-slate-500">Loading subscription...</p>
				)}
			</div>
		</div>
	);
}

function toDateInput(value?: string | null) {
	return value ? value.slice(0, 10) : "";
}

function formatMoney(value: number, currency: string) {
	return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
}
