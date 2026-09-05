import { useState } from "react";
import {
  type CreateContactInput,
  type Customer,
  type CustomerContact,
} from "@template/shared";
import { Mail, Phone, Plus, Send, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CustomerContactsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (input: CreateContactInput) => void;
  onGenerateMagicLink: (contact: CustomerContact) => void;
  isPending?: boolean;
}

export function CustomerContactsModal({
  customer,
  isOpen,
  onClose,
  onAddContact,
  onGenerateMagicLink,
  isPending,
}: CustomerContactsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [phone, setPhone] = useState("");

  if (!isOpen || !customer) return null;

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    onAddContact({
      name: name.trim(),
      email: email.trim(),
      roleTitle: roleTitle.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setName("");
    setEmail("");
    setRoleTitle("");
    setPhone("");
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="bg-card relative w-full max-w-2xl space-y-6 border-border p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                Authorized Contacts
              </span>
              <span className="text-xs text-muted-foreground">
                {customer.tier} Tier Account
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {customer.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Procurement stakeholders eligible to receive quotation magic links
              and negotiate line items.
            </p>
          </div>
          <button
            className="hover:bg-muted rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Contacts List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Account Representatives ({customer.contacts.length})
            </label>
            {!showAddForm && (
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                type="button"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="size-3.5" />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          {customer.contacts.length === 0 ? (
            <div className="bg-muted/40 rounded-lg border border-border p-6 text-center text-xs text-muted-foreground">
              No contacts registered for this account yet. Add a procurement
              stakeholder below.
            </div>
          ) : (
            <div className="space-y-2">
              {customer.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-card/60 flex items-center justify-between rounded-xl border border-border p-3.5 transition-all hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-xs font-bold text-foreground">
                      {contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {contact.name}
                        </span>
                        {contact.roleTitle && (
                          <span className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                            {contact.roleTitle}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="size-3" />
                          {contact.email}
                        </span>
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="gap-1.5 text-xs"
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => onGenerateMagicLink(contact)}
                  >
                    <Send className="size-3 text-primary" />
                    <span>Magic Link</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inline Add Contact Form */}
        {showAddForm && (
          <form
            className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
            onSubmit={handleCreateContact}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <UserPlus className="size-3.5" />
                Add New Contact
              </span>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                type="button"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Full Name (e.g. David Sterling)"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Corporate Email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Job Title (e.g. VP Procurement)"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
              />
              <Input
                placeholder="Phone (Optional)"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={isPending}
              size="sm"
              type="submit"
            >
              {isPending ? "Adding..." : "Save Contact"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            <span>Contacts are synchronized with customer portal auth.</span>
          </div>
          <Button variant="outline" type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
