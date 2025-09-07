import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, X } from 'lucide-react';

interface TutorFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchQuery: string;
  educationLevel: string[];
  teachingLevel: string[];
  subjects: string[];
  gender: string[];
  teachingLocation: string[];
  minRating: number;
  maxHourlyRate: number;
}

const EDUCATION_LEVELS = [
  { value: 'diploma', label: 'Diploma' },
  { value: 'degree', label: 'Degree' },
  { value: 'masters', label: 'Masters' },
  { value: 'phd', label: 'PhD' }
];

const TEACHING_LEVELS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'tertiary', label: 'Tertiary' }
];

const SUBJECTS = [
  'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Languages'
];

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

const TEACHING_LOCATIONS = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-person' },
  { value: 'institute', label: 'Institute' }
];

export function TutorFilters({ onFiltersChange }: TutorFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    educationLevel: [],
    teachingLevel: [],
    subjects: [],
    gender: [],
    teachingLocation: [],
    minRating: 0,
    maxHourlyRate: 1000
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      searchQuery: '',
      educationLevel: [],
      teachingLevel: [],
      subjects: [],
      gender: [],
      teachingLocation: [],
      minRating: 0,
      maxHourlyRate: 1000
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleArrayFilter = (category: keyof FilterState, value: string, checked: boolean) => {
    const currentArray = filters[category] as string[];
    let newArray;
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    updateFilters({ [category]: newArray });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, subject, or keyword..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {(filters.educationLevel.length > 0 || filters.teachingLevel.length > 0 || 
          filters.subjects.length > 0 || filters.gender.length > 0 || 
          filters.teachingLocation.length > 0) && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Tutors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Education Level */}
              <div>
                <h4 className="font-medium mb-3">Education Level</h4>
                <div className="space-y-2">
                  {EDUCATION_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`education-${level.value}`}
                        checked={filters.educationLevel.includes(level.value)}
                        onCheckedChange={(checked) => 
                          handleArrayFilter('educationLevel', level.value, checked as boolean)
                        }
                      />
                      <label htmlFor={`education-${level.value}`} className="text-sm">
                        {level.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teaching Level */}
              <div>
                <h4 className="font-medium mb-3">Teaching Level</h4>
                <div className="space-y-2">
                  {TEACHING_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`teaching-${level.value}`}
                        checked={filters.teachingLevel.includes(level.value)}
                        onCheckedChange={(checked) => 
                          handleArrayFilter('teachingLevel', level.value, checked as boolean)
                        }
                      />
                      <label htmlFor={`teaching-${level.value}`} className="text-sm">
                        {level.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teaching Location */}
              <div>
                <h4 className="font-medium mb-3">Teaching Location</h4>
                <div className="space-y-2">
                  {TEACHING_LOCATIONS.map((location) => (
                    <div key={location.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.value}`}
                        checked={filters.teachingLocation.includes(location.value)}
                        onCheckedChange={(checked) => 
                          handleArrayFilter('teachingLocation', location.value, checked as boolean)
                        }
                      />
                      <label htmlFor={`location-${location.value}`} className="text-sm">
                        {location.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <h4 className="font-medium mb-3">Gender</h4>
                <div className="space-y-2">
                  {GENDERS.map((gender) => (
                    <div key={gender.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gender-${gender.value}`}
                        checked={filters.gender.includes(gender.value)}
                        onCheckedChange={(checked) => 
                          handleArrayFilter('gender', gender.value, checked as boolean)
                        }
                      />
                      <label htmlFor={`gender-${gender.value}`} className="text-sm">
                        {gender.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <h4 className="font-medium mb-3">Subjects</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {SUBJECTS.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={filters.subjects.includes(subject)}
                        onCheckedChange={(checked) => 
                          handleArrayFilter('subjects', subject, checked as boolean)
                        }
                      />
                      <label htmlFor={`subject-${subject}`} className="text-sm">
                        {subject}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating & Price */}
              <div>
                <h4 className="font-medium mb-3">Rating & Price</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Minimum Rating</label>
                    <Select
                      value={filters.minRating.toString()}
                      onValueChange={(value) => updateFilters({ minRating: parseFloat(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Any Rating</SelectItem>
                        <SelectItem value="1">1+ Stars</SelectItem>
                        <SelectItem value="2">2+ Stars</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Max Hourly Rate</label>
                    <Input
                      type="number"
                      value={filters.maxHourlyRate}
                      onChange={(e) => updateFilters({ maxHourlyRate: parseInt(e.target.value) || 1000 })}
                      placeholder="Max rate per hour"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}