import { Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { type CreditRates } from '@shared/schema';

interface ConfigurationPanelProps {
  creditRates: CreditRates;
  onCreditRatesChange: (rates: CreditRates) => void;
  channelFilters: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  onChannelFiltersChange: (filters: { sms: boolean; email: boolean; push: boolean; }) => void;
  totals: {
    sms: number;
    email: number;
    push: number;
    grand: number;
  };
}

export function ConfigurationPanel({ 
  creditRates, 
  onCreditRatesChange, 
  channelFilters, 
  onChannelFiltersChange, 
  totals 
}: ConfigurationPanelProps) {
  const handleRateChange = (channel: keyof CreditRates, value: string) => {
    const numValue = parseFloat(value) || 0;
    onCreditRatesChange({
      ...creditRates,
      [channel]: numValue
    });
  };

  const handleChannelFilterChange = (channel: keyof typeof channelFilters, checked: boolean) => {
    onChannelFiltersChange({
      ...channelFilters,
      [channel]: checked
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Settings className="text-primary-500 h-5 w-5 mr-2" />
        Credit Configuration
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Credit Rates and Filters Section */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Credit Rates */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Credit Rates per Message</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sms-rate" className="block text-sm text-gray-600 mb-1">
                    SMS
                  </Label>
                  <div className="relative">
                    <Input
                      id="sms-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditRates.sms}
                      onChange={(e) => handleRateChange('sms', e.target.value)}
                      className="pr-12 text-sm"
                    />
                    <span className="absolute right-2 top-2 text-gray-400 text-xs">credits</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email-rate" className="block text-sm text-gray-600 mb-1">
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditRates.email}
                      onChange={(e) => handleRateChange('email', e.target.value)}
                      className="pr-12 text-sm"
                    />
                    <span className="absolute right-2 top-2 text-gray-400 text-xs">credits</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="push-rate" className="block text-sm text-gray-600 mb-1">
                    Push
                  </Label>
                  <div className="relative">
                    <Input
                      id="push-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditRates.push}
                      onChange={(e) => handleRateChange('push', e.target.value)}
                      className="pr-12 text-sm"
                    />
                    <span className="absolute right-2 top-2 text-gray-400 text-xs">credits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Filters */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4">Include Message Types in Calculation</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms-filter"
                    checked={channelFilters.sms}
                    onCheckedChange={(checked) => handleChannelFilterChange('sms', checked as boolean)}
                  />
                  <Label htmlFor="sms-filter" className="text-sm text-gray-600">
                    SMS Messages
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email-filter"
                    checked={channelFilters.email}
                    onCheckedChange={(checked) => handleChannelFilterChange('email', checked as boolean)}
                  />
                  <Label htmlFor="email-filter" className="text-sm text-gray-600">
                    Email Messages
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="push-filter"
                    checked={channelFilters.push}
                    onCheckedChange={(checked) => handleChannelFilterChange('push', checked as boolean)}
                  />
                  <Label htmlFor="push-filter" className="text-sm text-gray-600">
                    Push Notifications
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Totals Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-4">Credit Totals</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">SMS:</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(totals.sms).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email:</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(totals.email).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Push:</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(totals.push).toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Monthly Total:</span>
                <span className="text-lg font-semibold text-primary-600">
                  {Math.round(totals.grand).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium text-gray-900">Annual Total:</span>
                <span className="text-lg font-semibold text-[#00CECB]">
                  {Math.round(totals.grand * 12).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-[#00CECB]/10 border border-[#00CECB]/20 rounded-lg p-3">
            <p className="text-sm text-[#00CECB] italic">Calculations above are shown as monthly totals based on typical billing cycles. Please visit this page on desktop if you are experiencing usability issues.</p>
          </div>
        </div>
      </div>
    </div>
  );
}