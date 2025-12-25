from sqlalchemy.orm import Session
from src.domain.Supplement.models import SupplementModel, SupplementCompoundModel
from src.domain.Supplement.schemas import Supplement, SupplementCompound
from src.domain.Compound.schemas import Compound, CompoundUnit


class SupplementRepository:
    def __init__(self, db: Session):
        self.db = db

    def _model_to_schema(self, model: SupplementModel) -> Supplement:
        compounds = []
        for sc in model.supplement_compounds:
            # Skip if compound was deleted (orphaned reference)
            if sc.compound is None:
                continue
            compound = Compound(
                id=sc.compound.id,
                name=sc.compound.name,
                unit=CompoundUnit(sc.compound.unit)
            )
            compounds.append(SupplementCompound(
                compound=compound,
                amount=sc.amount
            ))
        
        return Supplement(
            id=model.id,
            brand=model.brand,
            name=model.name,
            serving_name=model.serving_name,
            compounds=compounds
        )

    def get_by_id(self, supplement_id: int) -> Supplement | None:
        model = self.db.query(SupplementModel).filter(SupplementModel.id == supplement_id).first()
        if model is None:
            return None
        return self._model_to_schema(model)

    def get_all(self) -> list[Supplement]:
        models = self.db.query(SupplementModel).all()
        return [self._model_to_schema(m) for m in models]

    def create(self, brand: str, name: str, serving_name: str, compounds: list[dict]) -> Supplement:
        """
        compounds: list of {"compound_id": int, "amount": float}
        """
        model = SupplementModel(
            brand=brand,
            name=name,
            serving_name=serving_name
        )
        self.db.add(model)
        self.db.flush()
        
        for comp in compounds:
            sc = SupplementCompoundModel(
                supplement_id=model.id,
                compound_id=comp["compound_id"],
                amount=comp["amount"]
            )
            self.db.add(sc)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def update(self, supplement_id: int, brand: str, name: str, serving_name: str, compounds: list[dict]) -> Supplement | None:
        """
        compounds: list of {"compound_id": int, "amount": float}
        """
        model = self.db.query(SupplementModel).filter(SupplementModel.id == supplement_id).first()
        if model is None:
            return None
        
        model.brand = brand
        model.name = name
        model.serving_name = serving_name
        
        # Delete existing compound associations
        self.db.query(SupplementCompoundModel).filter(
            SupplementCompoundModel.supplement_id == supplement_id
        ).delete()
        
        # Add new compound associations
        for comp in compounds:
            sc = SupplementCompoundModel(
                supplement_id=model.id,
                compound_id=comp["compound_id"],
                amount=comp["amount"]
            )
            self.db.add(sc)
        
        self.db.commit()
        self.db.refresh(model)
        return self._model_to_schema(model)

    def delete(self, supplement_id: int) -> Supplement | None:
        model = self.db.query(SupplementModel).filter(SupplementModel.id == supplement_id).first()
        if model is None:
            return None
        supplement = self._model_to_schema(model)
        self.db.delete(model)
        self.db.commit()
        return supplement

    def delete_all(self) -> list[Supplement]:
        models = self.db.query(SupplementModel).all()
        supplements = [self._model_to_schema(m) for m in models]
        for model in models:
            self.db.delete(model)
        self.db.commit()
        return supplements
